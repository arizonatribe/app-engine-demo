#!/usr/bin/env python

"""
parser.py -- Udacity conference server-side Python App Engine API;
    helper that supports the conference.py Endpoints

$Id: parser.py,v 1.1 2016/01/12 21:37

"""

import endpoints

from google.appengine.ext import ndb

from models import Profile
from models import TeeShirtSize

from utils import getUserId
from mapper import FormMapper

class EntityHelper(FormMapper):
    """Helper class that performs repetitive parsing operations to abstract it away to the conference.py"""

    def _getSpeaker(self, spkr_id):
        """get Speaker object from request; bail if not found"""
        speaker = ndb.Key(urlsafe=spkr_id).get()
        if not speaker:
            raise endpoints.NotFoundException(
                'No speaker found with key: %s' % spkr_id)
        return speaker

    def _retrieveConference(self, conf_id):
        """get Conference object from request; bail if not found"""
        conf = ndb.Key(urlsafe=conf_id).get()
        if not conf:
            raise endpoints.NotFoundException(
                'No conference found with key: %s' % conf_id)
        return conf

    def _retrieveSession(self, sess_id):
        """get Session object from request; bail if not found"""
        sess = ndb.Key(urlsafe=sess_id).get()
        if not sess:
            raise endpoints.NotFoundException(
                'No session found with key: %s' % sess_id)
        return sess

    def _getUser(self):
        """Make sure the user is authenticated, if so return their user settings"""
        user = endpoints.get_current_user()
        if not user:
            raise endpoints.UnauthorizedException('Authorization required')
        return getUserId(user)

    def _getUserProfileKey(self, user_id=None):
        """Get the user Profile key from datastore"""
        if not user_id:
            user_id = self._getUser()
        return ndb.Key(Profile, user_id)
        
    def _getUserProfile(self, user_id=None):
        """Get the user Profile from datastore"""
        return self._getUserProfileKey(user_id).get()
        
    def _getProfileFromUser(self):
        """Return user Profile from datastore, creating new one if non-existent."""
        # get Profile from datastore
        p_key = self._getUserProfileKey()
        profile = p_key.get()
        # create new Profile if not there
        if not profile:
            user = endpoints.get_current_user()
            profile = Profile(
                key = p_key,
                displayName = user.nickname(),
                mainEmail= user.email(),
                teeShirtSize = str(TeeShirtSize.NOT_SPECIFIED),
            )
            profile.put()

        return profile
