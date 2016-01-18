#!/usr/bin/env python

"""
conference.py -- Udacity conference server-side Python App Engine API;
    uses Google Cloud Endpoints

"""

from datetime import datetime, time

import endpoints
from protorpc import messages
from protorpc import message_types
from protorpc import remote

from google.appengine.api import memcache
from google.appengine.api import taskqueue
from google.appengine.ext import ndb

from models import ConflictException
from models import Profile
from models import ProfileMiniForm
from models import ProfileForm
from models import ProfileForms
from models import Speaker
from models import SpeakerForm
from models import SpeakerForms
from models import BooleanMessage
from models import StringMessage
from models import Conference
from models import ConferenceForm
from models import ConferenceForms
from models import ConferenceQueryForm
from models import ConferenceQueryForms
from models import ConferenceSession
from models import ConferenceSessionForm
from models import ConferenceSessionForms
from models import Wishlist
from models import WishlistForm
from models import SessionType
from models import TeeShirtSize

from entityhelper import EntityHelper

from settings import WEB_CLIENT_ID

EMAIL_SCOPE = endpoints.EMAIL_SCOPE
API_EXPLORER_CLIENT_ID = endpoints.API_EXPLORER_CLIENT_ID
MEMCACHE_ANNOUNCEMENTS_KEY = "RECENT_ANNOUNCEMENTS"
MEMCACHE_SESSION_KEY = "SPEAKER_AND_SESSION"

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

DEFAULTS = {
    "city": "Default City",
    "maxAttendees": 0,
    "seatsAvailable": 0,
    "topics": [ "Default", "Topic" ],
}

SESSION_DEFAULTS = {
    "duration": 60,
    "startTime": "10:30"
}

OPERATORS = {
    'EQ':   '=',
    'GT':   '>',
    'GTEQ': '>=',
    'LT':   '<',
    'LTEQ': '<=',
    'NE':   '!='
}

FIELDS =    {
    'CITY': 'city',
    'TOPIC': 'topics',
    'MONTH': 'month',
    'MAX_ATTENDEES': 'maxAttendees',
}

CONF_GET_REQUEST = endpoints.ResourceContainer(
    message_types.VoidMessage,
    websafeConferenceKey=messages.StringField(1),
)

CONF_BY_TYPE_GET_REQUEST = endpoints.ResourceContainer(
    message_types.VoidMessage,
    sessionType=messages.StringField(1),
)

CONF_BY_SPKR_GET_REQUEST = endpoints.ResourceContainer(
    message_types.VoidMessage,
    speakerUserId=messages.StringField(1),
)

CONF_POST_REQUEST = endpoints.ResourceContainer(
    ConferenceForm,
    websafeConferenceKey=messages.StringField(1),
)

CONF_SESS_POST_REQUEST = endpoints.ResourceContainer(
    ConferenceSessionForm,
    websafeConferenceKey=messages.StringField(1),
)

CONF_WISH_REQUEST = endpoints.ResourceContainer(
    message_types.VoidMessage,
    websafeSessionKey=messages.StringField(1),
)

CONF_WISH_POST_REQUEST = endpoints.ResourceContainer(
    WishlistForm,
    websafeSessionKey=messages.StringField(1),
)

CONF_SPKR_GET_REQUEST = endpoints.ResourceContainer(
    message_types.VoidMessage,
    websafeSpeakerKey=messages.StringField(1)
)

CONF_SPKR_POST_REQUEST = endpoints.ResourceContainer(
    SpeakerForm,
    websafeSpeakerKey=messages.StringField(1)
)

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


@endpoints.api(name='conference', version='v1', 
    allowed_client_ids=[WEB_CLIENT_ID, API_EXPLORER_CLIENT_ID],
    scopes=[EMAIL_SCOPE])
class ConferenceApi(remote.Service, EntityHelper):
    """Conference API v0.1"""

# - - - Conference objects - - - - - - - - - - - - - - - - -

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

    @endpoints.method(ConferenceForm, ConferenceForm, path='conference',
            http_method='POST', name='createConference')
    def createConference(self, request):
        """Create new conference."""
        return self._createConferenceObject(request)

    @endpoints.method(CONF_POST_REQUEST, ConferenceForm,
            path='conference/{websafeConferenceKey}',
            http_method='PUT', name='updateConference')
    def updateConference(self, request):
        """Update conference w/provided fields & return w/updated info."""
        return self._updateConferenceObject(request)

    @endpoints.method(CONF_GET_REQUEST, BooleanMessage,
            path='conference/{websafeConferenceKey}',
            http_method='DELETE', name='deleteConference')
    def deleteConference(self, request):
        """Delete conference."""
        conf = self._retrieveConference(request.websafeConferenceKey)
        conf_sess = ConferenceSession.query()
        
        if conf_sess:
            for sess in conf_sess:
                sess.key.delete()
        
        conf.key.delete()

        return BooleanMessage(data=True)

    @endpoints.method(CONF_GET_REQUEST, ConferenceForm,
            path='conference/{websafeConferenceKey}',
            http_method='GET', name='getConference')
    def getConference(self, request):
        """Return requested conference (by websafeConferenceKey)."""
        conf = self._retrieveConference(request.websafeConferenceKey)
        prof = conf.key.parent().get()
        
        return self.toConferenceForm(conf, getattr(prof, 'displayName'))

    @endpoints.method(message_types.VoidMessage, ConferenceForms,
            path='getConferencesCreated',
            http_method='POST', name='getConferencesCreated')
    def getConferencesCreated(self, request):
        """Return conferences created by user."""
        user_id =  self._getUser()
        # create ancestor query for all key matches for this user
        confs = Conference.query(ancestor=ndb.Key(Profile, user_id))
        # return set of ConferenceForm objects per Conference
        return ConferenceForms(
            items=[self.toConferenceForm(conf, getattr(self._getUserProfile(user_id), 'displayName')) for conf in confs]
        )

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
        return (inequality_field, formatted_filters)

    @endpoints.method(ConferenceQueryForms, ConferenceForms,
            path='queryConferences',
            http_method='POST',
            name='queryConferences')
    def queryConferences(self, request):
        """Query for conferences."""
        conferences = self._getQuery(request)

        # need to fetch organiser displayName from profiles
        # get all keys and use get_multi for speed
        organisers = [(ndb.Key(Profile, conf.organizerUserId)) for conf in conferences]
        profiles = ndb.get_multi(organisers)

        # put display names in a dict for easier fetching
        names = {}
        for profile in profiles:
            names[profile.key.id()] = profile.displayName

        # return individual ConferenceForm object per Conference
        return ConferenceForms(
            items=[self.toConferenceForm(conf, names[conf.organizerUserId]) for conf in conferences]
        )

# - - - Session objects - - - - - - - - - - - - - - - - - - - 

    def _createConferenceSessionObject(self, request):
        """Create or update ConferenceSession object, returning ConferenceSessionForm/request."""
        p_key = self._getUserProfileKey()
        if not request.name:
            raise endpoints.BadRequestException("Session 'name' field required")

        # copy ConferenceSessionForm/ProtoRPC Message into dict
        data = {field.name: getattr(request, field.name) for field in request.all_fields()}
        data['typeOfSession'] = str(data['typeOfSession'])
        del data['websafeConferenceKey']
        del data['websafeSessionKey']
        del data['speakerDisplayName']

        # add default values for those missing (both data model & outbound Message)
        for df in SESSION_DEFAULTS:
            if data[df] in (None, []):
                data[df] = SESSION_DEFAULTS[df]
                setattr(request, df, SESSION_DEFAULTS[df])

        # convert date from strings to Date objects
        if data['date']:
            data['date'] = datetime.strptime(data['date'][:10], "%Y-%m-%d").date()

        if data['startTime']:
            data['startTime'] = datetime.strptime(data['startTime'], "%I:%M %p").time()
            print data['startTime']
            #print datetime.strptime(data['startTime'], "%H:%M %p")
            #print datetime.strptime(data['startTime'], "%H:%M %p")
        
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
        taskqueue.add(params={'speaker_id': request.speakerUserId,
            'conf_id': conf.key},
            url='/tasks/set_speaker_and_sessions'
        )
        conf_sess = ndb.Key(urlsafe=cs_key.urlsafe()).get()
        return self.toConferenceSessionForm(conf_sess, speakerDisplayName)

    @endpoints.method(CONF_GET_REQUEST, ConferenceSessionForms,
            path='conference/{websafeConferenceKey}/sessions',
            http_method='GET',
            name='getConferenceSessions')
    def getConferenceSessions(self, request):
        """Given a conference, return all sessions"""
        profile = self._getUserProfile()
        conf = self._retrieveConference(request.websafeConferenceKey)
        conf_sess = ConferenceSession.query(ancestor=conf.key)

        # return set of ConferenceSessionForm objects per ConferenceSession
        return ConferenceSessionForms(
            items=[self.toConferenceSessionForm(cs, getattr(profile, 'displayName')) for cs in conf_sess]
        )
        
    @endpoints.method(CONF_WISH_REQUEST, ConferenceSessionForm,
            path='session/{websafeSessionKey}',
            http_method='GET',
            name='getConferenceSession')
    def getConferenceSession(self, request):
        """Get a conference session by id"""
        conf_sess = self._retrieveSession(request.websafeSessionKey)
        speakerDisplayName = None
        if conf_sess.speakerUserId:
            speaker = self._getSpeaker(conf_sess.speakerUserId)
            speakerDisplayName = speaker.displayName

        # return ConferenceSessionForm
        return self.toConferenceSessionForm(conf_sess, speakerDisplayName)

    @endpoints.method(message_types.VoidMessage, ConferenceSessionForms,
            path='sessions',
            http_method='GET',
            name='getAllSessions')
    def getAllSessions(self, request):
        """return all sessions"""
        conf_sess = ConferenceSession.query()

        # return set of ConferenceSessionForm objects
        return ConferenceSessionForms(
            items=[self.toConferenceSessionForm(cs) for cs in conf_sess]
        )

    @endpoints.method(CONF_BY_TYPE_GET_REQUEST, ConferenceSessionForms,
            path='sessions/type/{sessionType}',
            http_method='GET',
            name='getConferenceSessionsByType')
    def getConferenceSessionsByType(self, request):
        """Given a conference, return all sessions of a specified type (eg lecture, keynote, workshop)"""
        conf_sess = ConferenceSession.query(ndb.AND(ConferenceSession.typeOfSession==request.sessionType))
        # return set of ConferenceSessionForm objects per ConferenceSession
        return ConferenceSessionForms(
            items=[self.toConferenceSessionForm(cs) for cs in conf_sess]
        )

    @endpoints.method(message_types.VoidMessage, ConferenceSessionForms,
            path='sessions/earlynonworkshop',
            http_method='GET',
            name='getDaytimeNonWorkshopSessions')
    def getDaytimeNonWorkshopSessions(self, request):
        """Get sessions before 7pm and non-worksop"""
        conf_sess = ConferenceSession.query(ConferenceSession.typeOfSession.IN([
            str(SessionType.UNKNOWN),
            str(SessionType.LECTURE),
            str(SessionType.KEYNOTE),
            str(SessionType.MEETUP)
        ]))
        no_early_workshop = conf_sess.filter(ConferenceSession.startTime < time(19,00))
        if no_early_workshop:
            # return set of ConferenceSessionForm objects per ConferenceSession
            return ConferenceSessionForms(
                items=[self.toConferenceSessionForm(cs) for cs in no_early_workshop]
            )
        else:
            return ConferenceSessionForms(
                items=[self.toConferenceSessionForm()]
            )
            

    @endpoints.method(CONF_BY_SPKR_GET_REQUEST, ConferenceSessionForms,
            path='sessions/speaker/{speakerUserId}',
            http_method='GET',
            name='getSessionsBySpeaker')
    def getSessionsBySpeaker(self, request):
        """Given a speaker, return all sessions given by this particular speaker, across all conferences"""
        conf_sess = ConferenceSession.query(ndb.AND(ConferenceSession.speakerUserId==request.speakerUserId))
        speaker = self._getSpeaker(request.speakerUserId)
        # return set of ConferenceSessionForm objects per ConferenceSession
        return ConferenceSessionForms(
            items=[self.toConferenceSessionForm(cs, getattr(speaker, 'displayName')) for cs in conf_sess]
        )

    @endpoints.method(CONF_SESS_POST_REQUEST, ConferenceSessionForm,
            path='conference/{websafeConferenceKey}/sessions',
            http_method='POST',
            name='createConferenceSession')
    def createSession(self, request):
        """Create new session (open only to the organizer of the conference"""
        return self._createConferenceSessionObject(request)
        
    @endpoints.method(CONF_WISH_REQUEST, BooleanMessage,
            path='session/{websafeSessionKey}',
            http_method='DELETE',
            name='deleteConferenceSession')
    def deleteConferenceSession(self, request):
        """Remove session"""
        wssk = request.websafeSessionKey
        sess = ndb.Key(urlsafe=wssk).get()
        if not sess:
            raise endpoints.NotFoundException(
                'No session found with key: %s' % wssk)

        sess.key.delete()

        return BooleanMessage(data=True)

# - - - Wishlist objects - - - - - - - - - - - - - - - - - - -
        
    def _createWishlistObject(self, request):
        """Create or update Wishlist object, returning WishlistForm/request."""
        user_id = self._getUser()
        p_key = self._getUserProfileKey(user_id)

        wssk = request.websafeSessionKey
        sess = ndb.Key(urlsafe=wssk).get()
        if not sess:
            raise endpoints.NotFoundException(
                'No session found with key: %s' % wssk)
        
        w_id = Wishlist.allocate_ids(size=1, parent=p_key)[0]
        w_key = ndb.Key(Wishlist, w_id, parent=p_key)

        w = {}
        w['key'] = w_key

        wish = Wishlist.query(ancestor=p_key).get()
        if not wish:
            w['sessions'] = [wssk]
            Wishlist(**w).put()
        elif wssk in wish.sessions:
            raise ConflictException(
                "You have already placed this session in your wishlist")
        else:
            wish.sessions.append(wssk)
            wish.put()
            w['sessions'] = [self._retrieveSession(cs_id) for cs_id in wish.sessions]
        
        return self.toWishlistForm(w)

    @endpoints.method(CONF_WISH_POST_REQUEST, WishlistForm,
            path='session/{websafeSessionKey}/wishlist',
            http_method='POST',
            name='addSessionToWishlist')
    def addSessionToWishlist(self, request):
        """Adds the session to the user's list of sessions they are interested in attending"""
        return self._createWishlistObject(request)
    
    @endpoints.method(message_types.VoidMessage, WishlistForm,
            path='session/wishlist/full',
            http_method='GET',
            name='getSessionsInWishlist')
    def getSessionsInWishlist(self, request):
        """Query for all the sessions in a conference that the user is interested in attending"""
        p_key = self._getUserProfileKey()
        wish = Wishlist.query(ancestor=p_key).get()

        wf = {}
        wf['key'] = p_key
        if wish:
            wf['sessions'] = [self._retrieveSession(cs_id) for cs_id in wish.sessions]

        return self.toWishlistForm(wf)

    @endpoints.method(CONF_WISH_REQUEST, BooleanMessage,
            path='session/{websafeSessionKey}/wishlist',
            http_method='DELETE',
            name='deleteSessionInWishlist')
    def deleteSessionInWishlist(self, request):
        """Removes the session from the users list of sessions they are interested in attending"""
        user_id = self._getUser()
        p_key = self._getUserProfileKey(user_id)

        wssk = request.websafeSessionKey
        sess = ndb.Key(urlsafe=wssk).get()
        if not sess:
            raise endpoints.NotFoundException(
                'No session found with key: %s' % wssk)
        
        wish = Wishlist.query(ancestor=p_key).get()
        if not wish:
            raise endpoints.NotFoundException('No wishlist found')

        if wssk in wish.sessions:
            wish.sessions.remove(wssk)
            wish.put()
            retVal = True
        else:
            retVal = False

        return BooleanMessage(data=retVal)

# - - - Profile objects - - - - - - - - - - - - - - - - - - -

    def _doProfile(self, save_request=None):
        """Get user Profile and return to user, possibly updating it first."""
        # get user Profile
        prof = self._getProfileFromUser()

        # if saveProfile(), process user-modifyable fields
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
        spkr = Speaker.query(ancestor=s_key).get()
        
        return self.toSpeakerForm(request, None, spkr.key.urlsafe())

    @endpoints.method(message_types.VoidMessage, ProfileForm,
            path='profile', http_method='GET', name='getProfile')
    def getProfile(self, request):
        """Return user profile."""
        return self._doProfile()

    @endpoints.method(message_types.VoidMessage, ProfileForms,
            path='profiles',
            http_method='GET', name='getProfiles')
    def getProfiles(self, request):
        """Return users (regardless if they are speakers)."""
        profiles = Profile.query()
        # return set of ProfileForm objects
        return ProfileForms(
            profiles=[self.toProfileForm(profile) for profile in profiles]
        )
        
    @endpoints.method(ProfileMiniForm, ProfileForm,
            path='profile', http_method='POST', name='saveProfile')
    def saveProfile(self, request):
        """Update & return user profile."""
        return self._doProfile(request)
        
    @endpoints.method(CONF_WISH_REQUEST, SpeakerForm,
            path='session/{websafeSessionKey}/speaker',
            http_method='GET', name='getFeaturedSpeaker')
    def getFeaturedSpeaker(self, request):
        """Return user assigned as speaker for a conference session."""
        speaker = Speaker.query(Speaker.sessionKeysToSpeakAt==request.websafeSessionKey)
        # return SpeakerForm object
        return self.toSpeakerForm(speaker)

    @endpoints.method(message_types.VoidMessage, SpeakerForms,
            path='speakers',
            http_method='GET', name='getSpeakers')
    def getSpeakers(self, request):
        """Return users who may be assigned as speakers for a conference session."""
        speakers = Speaker.query()
        # return set of SpeakerForm objects
        return SpeakerForms(
            speakers=[self.toSpeakerForm(speaker) for speaker in speakers]
        )

    @endpoints.method(CONF_SPKR_GET_REQUEST, SpeakerForm,
            path='speaker/{websafeSpeakerKey}',
            http_method='GET', name='getSpeaker')
    def getSpeaker(self, request):
        """Return a speaker by their unique id."""
        speaker = self._getSpeaker(request.websafeSpeakerKey)
        # return SpeakerForm object
        return self.toSpeakerForm(speaker)

    @endpoints.method(CONF_SPKR_POST_REQUEST, SpeakerForm,
            path='speaker', http_method='POST', name='createSpeaker')
    def createSpeaker(self, request):
        """Create a new speaker."""
        return self._createSpeaker(request)

    @endpoints.method(CONF_SPKR_POST_REQUEST, SpeakerForm,
            path='speaker/{websafeSpeakerKey}', http_method='PUT', name='saveSpeaker')
    def saveSpeaker(self, request):
        """Update & return speaker."""
        return self._createSpeaker(request)

    @endpoints.method(CONF_SPKR_GET_REQUEST, BooleanMessage,
            path='speaker/{websafeSpeakerKey}', http_method='DELETE', name='removeSpeaker')
    def removeSpeaker(self, request):
        """Remove the Speaker."""
        wssk = request.websafeSpeakerKey
        spkr = ndb.Key(urlsafe=wssk).get()
        if not spkr:
            raise endpoints.NotFoundException(
                'No speaker found with key: %s' % wssk)

        sessions = ConferenceSession.query(ndb.AND(
            ConferenceSession.speakerUserId==request.websafeSpeakerKey)
        ).fetch()

        if sessions:
            for session in sessions:
                session.speakerUserId = None
                session.put()

        spkr.key.delete()

        return BooleanMessage(data=True)
        
# - - - Registration - - - - - - - - - - - - - - - - - - - -

    @ndb.transactional(xg=True)
    def _conferenceRegistration(self, request, reg=True):
        """Register or unregister user for selected conference."""
        retval = None
        prof = self._getProfileFromUser() # get user Profile

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
            else:
                retval = False

        # write things back to the datastore & return
        prof.put()
        conf.put()
        return BooleanMessage(data=retval)

    @endpoints.method(message_types.VoidMessage, ConferenceForms,
            path='conferences/attending',
            http_method='GET', name='getConferencesToAttend')
    def getConferencesToAttend(self, request):
        """Get list of conferences that user has registered for."""
        prof = self._getProfileFromUser() # get user Profile
        conf_keys = [ndb.Key(urlsafe=wsck) for wsck in prof.conferenceKeysToAttend]
        conferences = ndb.get_multi(conf_keys)

        # get organizers
        organisers = [ndb.Key(Profile, conf.organizerUserId) for conf in conferences]
        profiles = ndb.get_multi(organisers)

        # put display names in a dict for easier fetching
        names = {}
        for profile in profiles:
            names[profile.key.id()] = profile.displayName

        # return set of ConferenceForm objects per Conference
        return ConferenceForms(items=[self.toConferenceForm(conf, names[conf.organizerUserId])\
         for conf in conferences]
        )

    @endpoints.method(CONF_GET_REQUEST, BooleanMessage,
            path='conference/{websafeConferenceKey}/register',
            http_method='POST', name='registerForConference')
    def registerForConference(self, request):
        """Register user for selected conference."""
        return self._conferenceRegistration(request)

    @endpoints.method(CONF_GET_REQUEST, BooleanMessage,
            path='conference/{websafeConferenceKey}/unregister',
            http_method='DELETE', name='unregisterFromConference')
    def unregisterFromConference(self, request):
        """Unregister user for selected conference."""
        return self._conferenceRegistration(request, reg=False)

# - - - Announcements - - - - - - - - - - - - - - - - - - - -

    @staticmethod
    def _cacheAnnouncement():
        """Create Announcement & assign to memcache; used by
        memcache cron job & putAnnouncement().
        """
        confs = Conference.query(ndb.AND(
            Conference.seatsAvailable <= 5,
            Conference.seatsAvailable > 0)
        ).fetch(projection=[Conference.name])

        if confs:
            # If there are almost sold out conferences,
            # format announcement and set it in memcache
            announcement = '%s %s' % (
                'Last chance to attend! The following conferences '
                'are nearly sold out:',
                ', '.join(conf.name for conf in confs))
            memcache.set(MEMCACHE_ANNOUNCEMENTS_KEY, announcement)
        else:
            # If there are no sold out conferences,
            # delete the memcache announcements entry
            announcement = ""
            memcache.delete(MEMCACHE_ANNOUNCEMENTS_KEY)

        return announcement

    @staticmethod
    def _cacheSpeakerAndSession(speaker_id, conf_id):
        """Assign Speaker and their Session to memcache; used by memcache cron job """
        sessions = ConferenceSession.query(ndb.AND(
            ConferenceSession.speakerUserId==speaker_id,
            ancestor==conf_id)
        ).fetch(projection=[Conference.name])
        
        if sessions and len(sessions) > 1:
            speaker = self._getSpeaker(speaker_id)
            session_message = '%s %s %s' % (
                speaker.displayName,
                'will be speaking at the following conferences: ',
                ', '.join(sess.name for sess in sessions))
            memcache.set(MEMCACHE_SESSION_KEY, session_message)
        else:
            session_message = ""
            memcache.delete(MEMCACHE_SESSION_KEY)

        return session_message

    @endpoints.method(message_types.VoidMessage, StringMessage,
            path='conference/announcement/get',
            http_method='GET', name='getAnnouncement')
    def getAnnouncement(self, request):
        """Return Announcement from memcache."""
        # return an existing announcement from Memcache or an empty string.
        announcement = memcache.get(MEMCACHE_ANNOUNCEMENTS_KEY)
        if not announcement:
            announcement = ""
        return StringMessage(data=announcement)

api = endpoints.api_server([ConferenceApi]) # register API
