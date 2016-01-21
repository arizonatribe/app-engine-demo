#!/usr/bin/env python

import endpoints

from google.appengine.ext import ndb

from models import Profile
from models import TeeShirtSize

from utils import getUserId
from mapper import FormMapper

class EntityHelper(FormMapper):
    """Helper class that performs repetitive parsing operations to abstract it away to the conference.py"""

    def _getEntity(self, key, entity_type="entity"):
        """gets an entity by its unique key; bail if not found"""
        entity = ndb.Key(urlsafe=key).get()
        if not entity:
            raise endpoints.NotFoundException(
                'No %s found with key: %s' % (entity_type, key))
        return entity
        
    def _getSpeaker(self, key):
        """get Speaker object from request; bail if not found"""
        return self._getEntity(key, 'speaker')

    def _retrieveConference(self, key):
        """get Conference object from request; bail if not found"""
        return self._getEntity(key, 'conference')

    def _retrieveSession(self, key):
        """get Session object from request; bail if not found"""
        return self._getEntity(key, 'session')

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
