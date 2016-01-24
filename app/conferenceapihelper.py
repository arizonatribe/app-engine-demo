#!/usr/bin/env python

from datetime import datetime

import endpoints

from google.appengine.api import taskqueue
from google.appengine.ext import ndb

from models import ConflictException
from models import Speaker
from models import BooleanMessage
from models import Conference
from models import ConferenceSession
from models import Wishlist

from entityhelper import EntityHelper

from settings import DEFAULTS
from settings import SESSION_DEFAULTS
from settings import OPERATORS
from settings import FIELDS


class ConferenceApiHelper(EntityHelper):
    """Helper for the Conference API endpoints methods to create NDB objects from requests"""

    def _createConferenceObject(self, request):
        """Create or update Conference object, returning ConferenceForm/request."""
        user_id = self._getUser()

        if not request.name:
            raise endpoints.BadRequestException("Conference 'name' field required")

        # copy ConferenceForm/ProtoRPC Message into dict
        data = {field.name: getattr(request, field.name) for field in request.all_fields()}
        del data['websafeConferenceKey']
        del data['organizerDisplayName']

        # add default values for those missing (both data model & outbound Message)
        for df in DEFAULTS:
            if data[df] in (None, []):
                data[df] = DEFAULTS[df]
                setattr(request, df, DEFAULTS[df])

        # convert dates from strings to Date objects; set month based on start_date
        if data['startDate']:
            data['startDate'] = datetime.strptime(data['startDate'][:10], "%Y-%m-%d").date()
            data['month'] = data['startDate'].month
        else:
            data['month'] = 0
        if data['endDate']:
            data['endDate'] = datetime.strptime(data['endDate'][:10], "%Y-%m-%d").date()

        # set seatsAvailable to be same as maxAttendees on creation
        if data["maxAttendees"] > 0:
            data["seatsAvailable"] = data["maxAttendees"]
        # generate Profile Key based on user ID and Conference
        # ID based on Profile key get Conference key from ID
        p_key = self._getUserProfileKey(user_id)
        c_id = Conference.allocate_ids(size=1, parent=p_key)[0]
        c_key = ndb.Key(Conference, c_id, parent=p_key)
        data['key'] = c_key
        data['organizerUserId'] = request.organizerUserId = user_id

        # create Conference, send email to organizer confirming
        # creation of Conference & return (modified) ConferenceForm
        Conference(**data).put()
        # add confirmation email sending task to queue
        user = endpoints.get_current_user()
        taskqueue.add(params={'email': user.email(),
                              'conferenceInfo': repr(request)},
                      url='/tasks/send_confirmation_email'
                      )
        return request

    @ndb.transactional()
    def _updateConferenceObject(self, request):
        user_id = self._getUser()
        conf = self._retrieveConference(request.websafeConferenceKey)

        # check that user is owner
        if user_id != conf.organizerUserId:
            raise endpoints.ForbiddenException(
                    'Only the owner can update the conference.')

            # copy ConferenceForm/ProtoRPC Message into dict
        data = {field.name: getattr(request, field.name) for field in request.all_fields()}

        # Not getting all the fields, so don't create a new object; just
        # copy relevant fields from ConferenceForm to Conference object
        for field in request.all_fields():
            data = getattr(request, field.name)
            # only copy fields where we get data
            if data not in (None, []):
                # special handling for dates (convert string to Date)
                if field.name in ('startDate', 'endDate'):
                    data = datetime.strptime(data, "%Y-%m-%d").date()
                    if field.name == 'startDate':
                        conf.month = data.month
                # write to Conference object
                setattr(conf, field.name, data)

        conf.put()
        return self.toConferenceForm(conf, getattr(self._getUserProfile(user_id), 'displayName'))

    def _getQuery(self, request):
        """Return formatted query from the submitted filters."""
        q = Conference.query()
        inequality_filter, filters = self._formatFilters(request.filters)

        # If exists, sort on inequality filter first
        if not inequality_filter:
            q = q.order(Conference.name)
        else:
            q = q.order(ndb.GenericProperty(inequality_filter))
            q = q.order(Conference.name)

        for filtr in filters:
            if filtr["field"] in ["month", "maxAttendees"]:
                filtr["value"] = int(filtr["value"])
            formatted_query = ndb.query.FilterNode(filtr["field"], filtr["operator"], filtr["value"])
            q = q.filter(formatted_query)

        return q

    def _formatFilters(self, filters):
        """Parse, check validity and format user supplied filters."""
        formatted_filters = []
        inequality_field = None

        for f in filters:
            filtr = {field.name: getattr(f, field.name) for field in f.all_fields()}

            try:
                filtr["field"] = FIELDS[filtr["field"]]
                filtr["operator"] = OPERATORS[filtr["operator"]]
            except KeyError:
                raise endpoints.BadRequestException("Filter contains invalid field or operator.")

            # Every operation except "=" is an inequality
            if filtr["operator"] != "=":
                # check if inequality operation has been used in previous filters
                # disallow the filter if inequality was performed on a different field before
                # track the field on which the inequality operation is performed
                if inequality_field and inequality_field != filtr["field"]:
                    raise endpoints.BadRequestException("Inequality filter is allowed on only one field.")
                else:
                    inequality_field = filtr["field"]

            formatted_filters.append(filtr)

        return inequality_field, formatted_filters

    def _createConferenceSessionObject(self, request):
        """Create or update ConferenceSession object, returning ConferenceSessionForm/request."""
        p_key = self._getUserProfileKey()
        if not request.name:
            raise endpoints.BadRequestException("Session 'name' field required")

        # copy ConferenceSessionForm/ProtoRPC Message into dict
        data = {field.name: getattr(request, field.name) for field in request.all_fields()}

        # add default values for those missing (both data model & outbound Message)
        for df in SESSION_DEFAULTS:
            if data[df] in (None, []):
                data[df] = SESSION_DEFAULTS[df]
                setattr(request, df, SESSION_DEFAULTS[df])

        if data['typeOfSession']:
            data['typeOfSession'] = str(data['typeOfSession'])
        # convert date from strings to Date objects
        if data['date']:
            data['date'] = datetime.strptime(data['date'][:10], "%Y-%m-%d").date()
        if data['startTime']:
            data['startTime'] = datetime.strptime(data['startTime'], "%I:%M %p").time()

        del data['websafeConferenceKey']
        del data['websafeSessionKey']
        del data['speakerDisplayName']

        conf = self._retrieveConference(request.websafeConferenceKey)

        # check that user is also the conference creator
        if p_key != conf.key.parent():
            raise endpoints.UnauthorizedException(
                    'Only Conference Creator can also create session')

        # check if session exists given websafeConfKey
        # get conference; check that it exists
        wsck = request.websafeConferenceKey
        conf = ndb.Key(urlsafe=wsck).get()
        if not conf:
            raise endpoints.NotFoundException(
                    'No conference found with key: %s' % wsck)

        # generate Profile Key based on user ID and Conference
        # ID based on Profile key get Conference key from ID
        cs_id = ConferenceSession.allocate_ids(size=1, parent=conf.key)[0]
        cs_key = ndb.Key(ConferenceSession, cs_id, parent=conf.key)
        data['key'] = cs_key

        speakerDisplayName = None
        speaker = None
        if request.speakerUserId:
            speaker = self._getSpeaker(request.speakerUserId)
            data['speakerUserId'] = request.speakerUserId
            speakerDisplayName = speaker.displayName

        # create ConferenceSession, send email to organizer confirming
        # creation of ConferenceSession & return (modified) ConferenceSessionForm
        ConferenceSession(**data).put()

        if speaker:
            wssk = cs_key.urlsafe()
            # check if speaker already scheduled to speak at this session
            if wssk in speaker.sessionKeysToSpeakAt:
                raise ConflictException(
                        "They are already set to speak for this conference")

            speaker.sessionKeysToSpeakAt.append(wssk)
            speaker.put()
        # add speaker name and their sessions task to queue
        taskqueue.add(params={'speakerId': request.speakerUserId,
                              'confId': conf.key.urlsafe()},
                      url='/tasks/set_speaker_and_sessions'
                      )
        conf_sess = ndb.Key(urlsafe=cs_key.urlsafe()).get()

        return self.toConferenceSessionForm(conf_sess, speakerDisplayName)

    def _createWishlistObject(self, request):
        """Create or update Wishlist object, returning WishlistForm/request."""
        user_id = self._getUser()
        p_key = self._getUserProfileKey(user_id)

        wssk = request.websafeSessionKey
        sess = ndb.Key(urlsafe=wssk).get()
        if not sess:
            raise endpoints.NotFoundException('No session found with key: %s' % wssk)

        w = {}

        # Create a unique key
        w_id = Wishlist.allocate_ids(size=1, parent=p_key)[0]
        w_key = ndb.Key(Wishlist, w_id, parent=p_key)
        w['key'] = w_key

        # Check for an existing wishlist
        wish = Wishlist.query(ancestor=p_key).get()

        # If there is already a wishlist record, append this session to it,
        # otherwise create a new wishlist (unless its already in the wishlist)
        if not wish:
            w['sessions'] = [wssk]
            Wishlist(**w).put()
        elif wssk in wish.sessions:
            raise ConflictException("You have already placed this session in your wishlist")
        else:
            wish.sessions.append(wssk)
            wish.put()
            w['sessions'] = [self._retrieveSession(cs_id) for cs_id in wish.sessions]

        return self.toWishlistForm(w)

    def _doProfile(self, save_request=None):
        """Get user Profile and return to user, possibly updating it first."""
        # get user Profile
        prof = self._getProfileFromUser()

        # if saveProfile(), process user-modifiable fields
        if save_request:
            for field in ('displayName', 'teeShirtSize'):
                if hasattr(save_request, field):
                    val = getattr(save_request, field)
                    if val:
                        setattr(prof, field, str(val))
            prof.put()

        # return ProfileForm
        return self.toProfileForm(prof)

    def _createSpeaker(self, request):
        """Creates a new Speaker and converts it to a SpeakerForm"""
        speaker = {field.name: getattr(request, field.name) for field in request.all_fields()}
        del speaker['websafeSpeakerKey']

        # Generate a unique key for the speaker
        s_id = Speaker.allocate_ids(size=1)[0]
        s_key = ndb.Key(Speaker, s_id)
        speaker['key'] = s_key
        Speaker(**speaker).put()

        return self.toSpeakerForm(request, None, s_key.urlsafe())

    @ndb.transactional(xg=True)
    def _conferenceRegistration(self, request, reg=True):
        """Register or unregister user for selected conference."""
        retval = False
        prof = self._getProfileFromUser()  # get user Profile

        # check if conf exists gven websafeConfKey
        # get conference; check that it exists
        wsck = request.websafeConferenceKey
        conf = ndb.Key(urlsafe=wsck).get()
        if not conf:
            raise endpoints.NotFoundException(
                    'No conference found with key: %s' % wsck)

        # register
        if reg:
            # check if user already registered otherwise add
            if wsck in prof.conferenceKeysToAttend:
                raise ConflictException(
                        "You have already registered for this conference")

            # check if seats avail
            if conf.seatsAvailable <= 0:
                raise ConflictException(
                        "There are no seats available.")

            # register user, take away one seat
            prof.conferenceKeysToAttend.append(wsck)
            conf.seatsAvailable -= 1
            retval = True

        # unregister
        else:
            # check if user already registered
            if wsck in prof.conferenceKeysToAttend:

                # unregister user, add back one seat
                prof.conferenceKeysToAttend.remove(wsck)
                conf.seatsAvailable += 1
                retval = True

        # write things back to the datastore & return
        prof.put()
        conf.put()

        return BooleanMessage(data=retval)
