#!/usr/bin/env python

"""
conference.py -- Udacity conference server-side Python App Engine API;
    uses Google Cloud Endpoints

"""

from datetime import time

import endpoints
from protorpc import message_types
from protorpc import remote

from google.appengine.api import memcache
from google.appengine.ext import ndb

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
from models import ConferenceQueryForms
from models import ConferenceSession
from models import ConferenceSessionForm
from models import ConferenceSessionForms
from models import Wishlist
from models import WishlistForm
from models import SessionType

from conferenceapihelper import ConferenceApiHelper

from settings import WEB_CLIENT_ID
from settings import EMAIL_SCOPE
from settings import API_EXPLORER_CLIENT_ID
from settings import MEMCACHE_ANNOUNCEMENTS_KEY
from settings import CONF_GET_REQUEST
from settings import SESS_BY_TYPE_GET_REQUEST
from settings import CONF_BY_TYPE_GET_REQUEST
from settings import CONF_BY_SPKR_GET_REQUEST
from settings import CONF_POST_REQUEST
from settings import CONF_SESS_POST_REQUEST
from settings import CONF_WISH_REQUEST
from settings import CONF_WISH_POST_REQUEST
from settings import CONF_SPKR_GET_REQUEST
from settings import CONF_SPKR_POST_REQUEST


# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

@endpoints.api(name='conference', version='v1', 
               allowed_client_ids=[WEB_CLIENT_ID, API_EXPLORER_CLIENT_ID],
               scopes=[EMAIL_SCOPE])
class ConferenceApi(remote.Service, ConferenceApiHelper):
    """Conference API v0.1"""

# - - - Conference endpoints - - - - - - - - - - - - - - - - -

    @endpoints.method(ConferenceForm, ConferenceForm,
                      path='conference',
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
        wsck = request.websafeConferenceKey
        conf = self._retrieveConference(wsck)
        if not conf:
            raise endpoints.NotFoundException('No conference found with key: %s' % wsck)

        # Remove the link between the sessions and this conference
        conf_sess = ConferenceSession.query(ancestor=conf.key)
        if conf_sess:
            for sess in conf_sess:
                wssk = sess.key.urlsafe()

                # Get all the wishlists that have this session in them and remove this session from them
                wishes = Wishlist.query(ndb.AND(Wishlist.sessions == wssk))
                for wish in wishes:
                    if wish and wssk in wish.sessions:
                        wish.sessions.remove(wssk)
                        wish.put()

                sess.key.delete()

        # Unregister the users from this conference if they are registered for it
        registered_users = Profile.query(ndb.AND(Profile.conferenceKeysToAttend == wsck))
        if registered_users:
            for reg_user in registered_users:
                if reg_user and wsck in reg_user.conferenceKeysToAttend:
                    reg_user.conferenceKeysToAttend.remove(wsck)
                    reg_user.put()

        conf.key.delete()

        return BooleanMessage(data=True)

    @endpoints.method(CONF_GET_REQUEST, ConferenceForm,
                      path='conference/{websafeConferenceKey}',
                      http_method='GET', name='getConference')
    def getConference(self, request):
        """Return requested conference (by websafeConferenceKey)."""
        conf = self._retrieveConference(request.websafeConferenceKey)
        if not conf:
            raise endpoints.NotFoundException('No conference found with key: %s' % request.websafeConferenceKey)
        
        prof = conf.key.parent().get()
        
        return self.toConferenceForm(conf, getattr(prof, 'displayName'))

    @endpoints.method(message_types.VoidMessage, ConferenceForms,
                      path='getConferencesCreated',
                      http_method='POST', name='getConferencesCreated')
    def getConferencesCreated(self, request):
        """Return conferences created by user."""
        user_id = self._getUser()
        # create ancestor query for all key matches for this user
        confs = Conference.query(ancestor=ndb.Key(Profile, user_id))
        # return set of ConferenceForm objects per Conference
        return ConferenceForms(
            items=[self.toConferenceForm(conf, getattr(self._getUserProfile(user_id), 'displayName')) for conf in confs]
        )

    @endpoints.method(ConferenceQueryForms, ConferenceForms,
                      path='queryConferences',
                      http_method='POST', name='queryConferences')
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

# - - - Session endpoints - - - - - - - - - - - - - - - - - - - 

    @endpoints.method(CONF_GET_REQUEST, ConferenceSessionForms,
                      path='conference/{websafeConferenceKey}/sessions',
                      http_method='GET', name='getConferenceSessions')
    def getConferenceSessions(self, request):
        """Given a conference, return all sessions"""
        profile = self._getUserProfile()
        conf = self._retrieveConference(request.websafeConferenceKey)
        if not conf:
            raise endpoints.NotFoundException('No conference found with key: %s' % request.websafeConferenceKey)

        conf_sess = ConferenceSession.query(ancestor=conf.key)

        # return set of ConferenceSessionForm objects per ConferenceSession
        return ConferenceSessionForms(
            items=[self.toConferenceSessionForm(cs, getattr(profile, 'displayName')) for cs in conf_sess]
        )
        
    @endpoints.method(CONF_WISH_REQUEST, ConferenceSessionForm,
                      path='session/{websafeSessionKey}',
                      http_method='GET', name='getConferenceSession')
    def getConferenceSession(self, request):
        """Get a conference session by id"""
        conf_sess = self._retrieveSession(request.websafeSessionKey)
        if not conf_sess:
            raise endpoints.NotFoundException('No session found with key: %s' % request.websafeSessionKey)
        
        speakerDisplayName = None
        if conf_sess.speakerUserId:
            speaker = self._getSpeaker(conf_sess.speakerUserId)
            speakerDisplayName = speaker.displayName

        return self.toConferenceSessionForm(conf_sess, speakerDisplayName)

    @endpoints.method(message_types.VoidMessage, ConferenceSessionForms,
                      path='sessions',
                      http_method='GET', name='getAllSessions')
    def getAllSessions(self, request):
        """return all sessions"""
        conf_sess = ConferenceSession.query()

        # return set of ConferenceSessionForm objects
        return ConferenceSessionForms(
            items=[self.toConferenceSessionForm(cs) for cs in conf_sess]
        )

    @endpoints.method(SESS_BY_TYPE_GET_REQUEST, ConferenceSessionForms,
                      path='sessions/type/{sessionType}',
                      http_method='GET', name='getAllSessionsByType')
    def getAllSessionsByType(self, request):
        """Given a conference, return all sessions of a specified type (eg lecture, keynote, workshop)"""
        sessions = ConferenceSession.query(ndb.AND(ConferenceSession.typeOfSession == request.sessionType))
        # return set of ConferenceSessionForm objects per ConferenceSession
        return ConferenceSessionForms(
            items=[self.toConferenceSessionForm(cs) for cs in sessions]
        )
        
    @endpoints.method(CONF_BY_TYPE_GET_REQUEST, ConferenceSessionForms,
                      path='conference/{websafeConferenceKey}/sessions/type/{sessionType}',
                      http_method='GET', name='getConferenceSessionsByType')
    def getConferenceSessionsByType(self, request):
        """Given a conference, return all sessions of a specified type (eg lecture, keynote, workshop)"""
        conf = self._retrieveConference(request.websafeConferenceKey)
        if not conf:
            raise endpoints.NotFoundException('No conference found with key: %s' % request.websafeConferenceKey)

        sessions = ConferenceSession.query(ancestor=conf.key)\
                                    .filter(ndb.AND(ConferenceSession.typeOfSession == request.sessionType))

        # return set of ConferenceSessionForm objects per ConferenceSession
        return ConferenceSessionForms(
            items=[self.toConferenceSessionForm(cs) for cs in sessions]
        )

    @endpoints.method(message_types.VoidMessage, ConferenceSessionForms,
                      path='sessions/earlynonworkshop',
                      http_method='GET', name='getDaytimeNonWorkshopSessions')
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
                      http_method='GET', name='getSessionsBySpeaker')
    def getSessionsBySpeaker(self, request):
        """Given a speaker, return all sessions given by this particular speaker, across all conferences"""
        conf_sess = ConferenceSession.query(ndb.AND(ConferenceSession.speakerUserId == request.speakerUserId))
        speaker = self._getSpeaker(request.speakerUserId)
        # return set of ConferenceSessionForm objects per ConferenceSession
        return ConferenceSessionForms(
            items=[self.toConferenceSessionForm(cs, getattr(speaker, 'displayName')) for cs in conf_sess]
        )

    @endpoints.method(CONF_SESS_POST_REQUEST, ConferenceSessionForm,
                      path='conference/{websafeConferenceKey}/sessions',
                      http_method='POST', name='createConferenceSession')
    def createSession(self, request):
        """Create new session (open only to the organizer of the conference"""
        return self._createConferenceSessionObject(request)
        
    @endpoints.method(CONF_WISH_REQUEST, BooleanMessage,
                      path='session/{websafeSessionKey}',
                      http_method='DELETE', name='deleteConferenceSession')
    def deleteConferenceSession(self, request):
        """Remove session"""
        sess = ndb.Key(urlsafe=request.websafeSessionKey).get()
        if not sess:
            raise endpoints.NotFoundException('No session found with key: %s' % request.websafeSessionKey)

        sess.key.delete()

        return BooleanMessage(data=True)

    @staticmethod
    def _cacheSpeakerAndSession(speaker_id, conf_id):
        """Assign Speaker and their Session to memcache; used by memcache cron job """
        session_message = ""

        # Make sure the conference and speaker are both valid
        if conf_id and speaker_id:
            conf = ndb.Key(urlsafe=conf_id).get()
            speaker = ndb.Key(urlsafe=speaker_id).get()

            if conf and speaker:
                # Now retrieve all sessions  for that conference at which this speaker will speak
                sessions = ConferenceSession.query(ancestor=conf.key)\
                    .filter(ndb.AND(ConferenceSession.speakerUserId == speaker_id))\
                    .fetch(projection=[Conference.name])

                # If this speaker is supposed to speak at multiple sessions,
                # throw a summary of all their sessions into the task queue
                if sessions and len(sessions) > 1:
                    session_message = '%s %s %s' % (
                        speaker.displayName,
                        'will be speaking at the following sessions: ',
                        ', '.join(sess.name for sess in sessions))
                    memcache.set(speaker.mainEmail, session_message)
                else:
                    memcache.delete(speaker.mainEmail)
            elif not conf:
                raise endpoints.NotFoundException('No conference found with key: %s' % conf_id)
            elif not speaker:
                raise endpoints.NotFoundException('No speaker found with key: %s' % speaker_id)
        elif not conf_id:
            raise endpoints.NotFoundException('No conference key was provided')
        elif not speaker_id:
            raise endpoints.NotFoundException('No speaker key was provided')

        return session_message

# - - - Wishlist endpoints - - - - - - - - - - - - - - - - - - -

    @endpoints.method(CONF_WISH_POST_REQUEST, WishlistForm,
                      path='session/{websafeSessionKey}/wishlist',
                      http_method='POST', name='addSessionToWishlist')
    def addSessionToWishlist(self, request):
        """Adds the session to the user's list of sessions they are interested in attending"""
        return self._createWishlistObject(request)
    
    @endpoints.method(message_types.VoidMessage, WishlistForm,
                      path='session/wishlist/full',
                      http_method='GET', name='getSessionsInWishlist')
    def getSessionsInWishlist(self, request):
        """Query for all the sessions in a conference that the user is interested in attending"""
        p_key = self._getUserProfileKey()
        wish = Wishlist.query(ancestor=p_key).get()

        if not wish:
            raise endpoints.NotFoundException('Your wishlist could not be found')

        wf = {'key': p_key, 'sessions': []}

        if len(wish.sessions) and any(s for s in wish.sessions):
            wf['sessions'] = [self._retrieveSession(cs_id) for cs_id in wish.sessions if cs_id is not None]

        return self.toWishlistForm(wf)

    @endpoints.method(CONF_WISH_REQUEST, BooleanMessage,
                      path='session/{websafeSessionKey}/wishlist',
                      http_method='DELETE', name='deleteSessionInWishlist')
    def deleteSessionInWishlist(self, request):
        """Removes the session from the users list of sessions they are interested in attending"""
        user_id = self._getUser()
        p_key = self._getUserProfileKey(user_id)
        wssk = request.websafeSessionKey

        wish = Wishlist.query(ancestor=p_key).get()
        if not wish:
            raise endpoints.NotFoundException('No wishlist found')

        # Remove this session key from this particular wishlist
        if wssk in wish.sessions:
            wish.sessions.remove(wssk)
            wish.put()
            retVal = True
        else:
            retVal = False

        return BooleanMessage(data=retVal)

# - - - Profile endpoints - - - - - - - - - - - - - - - - - - -

    @endpoints.method(message_types.VoidMessage, ProfileForm,
                      path='profile',
                      http_method='GET', name='getProfile')
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
                      path='profile',
                      http_method='POST', name='saveProfile')
    def saveProfile(self, request):
        """Update & return user profile."""
        return self._doProfile(request)
        
    @endpoints.method(CONF_GET_REQUEST, SpeakerForms,
                      path='conference/{websafeConferenceKey}/speakers',
                      http_method='GET', name='getConferenceSpeakers')
    def getConferenceSpeakers(self, request):
        """Return users assigned as speakers for a given conference's sessions."""
        conf = self._retrieveConference(request.websafeConferenceKey)
        if not conf:
            raise endpoints.NotFoundException('No conference found with key: %s' % request.websafeConferenceKey)
        
        # get all the sessions for this conference
        conf_sess = ConferenceSession.query(ancestor=conf.key)
        if not conf_sess:
            raise endpoints.NotFoundException('No sessions were found for this conference')
        
        # get all the speakers for this conference
        speaker_ids = [sess.speakerUserId for sess in conf_sess if sess is not None and sess.speakerUserId is not None]
        if not len(speaker_ids):
            raise endpoints.NotFoundException('No speakers are listed for any of this conference sessions')
        
        return SpeakerForms(
            speakers=[self.toSpeakerForm(
                self._getSpeaker(speaker)
            ) for speaker in set(speaker_ids)]
        )

    @endpoints.method(CONF_SPKR_GET_REQUEST, StringMessage,
                      path='speaker/{websafeSpeakerKey}/summary',
                      http_method='GET', name='getFeaturedSpeaker')
    def getFeaturedSpeaker(self, request):
        """Return speaker and conference summary from memcache."""
        speaker = self._getSpeaker(request.websafeSpeakerKey)
        if not speaker:
            raise endpoints.NotFoundException('A speaker was not found matching key %s' % request.websafeSpeakerKey)

        # return an existing speaker/conference summary from Memcache or an empty string.
        speaker_session_summary = memcache.get(speaker.mainEmail)
        if not speaker_session_summary:
            speaker_session_summary = ""

        return StringMessage(data=speaker_session_summary)

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
                      path='speaker',
                      http_method='POST', name='createSpeaker')
    def createSpeaker(self, request):
        """Create a new speaker."""
        return self._createSpeaker(request)

    @endpoints.method(CONF_SPKR_POST_REQUEST, SpeakerForm,
                      path='speaker/{websafeSpeakerKey}',
                      http_method='PUT', name='saveSpeaker')
    def saveSpeaker(self, request):
        """Update & return speaker."""
        return self._createSpeaker(request)

    @endpoints.method(CONF_SPKR_GET_REQUEST, BooleanMessage,
                      path='speaker/{websafeSpeakerKey}',
                      http_method='DELETE', name='removeSpeaker')
    def removeSpeaker(self, request):
        """Remove the Speaker."""
        wssk = request.websafeSpeakerKey
        spkr = ndb.Key(urlsafe=wssk).get()
        if not spkr:
            raise endpoints.NotFoundException('No speaker found with key: %s' % wssk)

        sessions = ConferenceSession.query(ndb.AND(
            ConferenceSession.speakerUserId == request.websafeSpeakerKey)
        ).fetch()

        # Remove the association this speaker has with any sessions
        if sessions:
            for session in sessions:
                session.speakerUserId = None
                session.put()

        spkr.key.delete()

        return BooleanMessage(data=True)
        
# - - - Registration - - - - - - - - - - - - - - - - - - - -

    @endpoints.method(message_types.VoidMessage, ConferenceForms,
                      path='conferences/attending',
                      http_method='GET', name='getConferencesToAttend')
    def getConferencesToAttend(self, request):
        """Get list of conferences that user has registered for."""
        prof = self._getProfileFromUser() # get user Profile

        # Get the conferences the user is registered to attend
        conf_keys = [ndb.Key(urlsafe=wsck) for wsck in prof.conferenceKeysToAttend]
        if not conf_keys or not len(conf_keys):
            return ConferenceForms(items=[])
        else:
            conferences = ndb.get_multi(conf_keys)
            if not any(c for c in conferences):
                wskeys = ', '.join([wkey.urlsafe() for wkey in conf_keys])
                raise endpoints.NotFoundException(
                    'The conferences to which you are registered could not be found: %s' % wskeys
                )

            # get all the conference organizers
            organisers = [ndb.Key(Profile, conf.organizerUserId) for conf in conferences if conf is not None]
            if not len(organisers):
                raise endpoints.NotFoundException('No conference organisers were found for these conferences')
            profiles = ndb.get_multi(organisers)

            # put display names in a dict for easier fetching
            names = {}
            for profile in profiles:
                names[profile.key.id()] = profile.displayName

            # return set of ConferenceForm objects per Conference
            return ConferenceForms(items=[
                self.toConferenceForm(conf, names[conf.organizerUserId]) for conf in conferences if conf is not None
            ])

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

# register API
api = endpoints.api_server([ConferenceApi])
