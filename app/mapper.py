#!/usr/bin/env python

from models import Profile
from models import ProfileForm
from models import SpeakerForm
from models import Conference
from models import ConferenceForm
from models import ConferenceSession
from models import ConferenceSessionForm
from models import Wishlist
from models import WishlistForm
from models import SessionType
from models import TeeShirtSize

class FormMapper(object):
    """Helper class that converts ndb objects into Forms returned to the API endpoint caller"""

    def toConferenceForm(self, conf=None, displayName=None):
        """Copy relevant fields from Conference to ConferenceForm."""
        cf = ConferenceForm()
        if conf:
            for field in cf.all_fields():
                if hasattr(conf, field.name):
                    # convert Date to date string; just copy others
                    if field.name.endswith('Date'):
                        setattr(cf, field.name, str(getattr(conf, field.name)))
                    else:
                        setattr(cf, field.name, getattr(conf, field.name))
                elif field.name == "websafeConferenceKey" and hasattr(conf, "key"):
                    setattr(cf, field.name, conf.key.urlsafe())
        if displayName:
            setattr(cf, 'organizerDisplayName', displayName)
        cf.check_initialized()
        return cf

    def toConferenceSessionForm(self, conf_sess=None, displayName=None):
        """Copy relevant fields from ConferenceSession to ConferenceSessionForm."""
        cf = ConferenceSessionForm()
        if conf_sess:
            for field in cf.all_fields():
                if hasattr(conf_sess, field.name):
                    # convert Date to date string
                    if field.name == "date":
                        setattr(cf, field.name, str(getattr(conf_sess, field.name)))
                    elif field.name == "startTime":
                        setattr(cf, field.name, conf_sess.startTime.strftime("%H:%M %p"))
                    elif field.name == 'typeOfSession':
                        setattr(cf, field.name, getattr(SessionType, getattr(conf_sess, field.name)))
                    else:
                        setattr(cf, field.name, getattr(conf_sess, field.name))
                elif field.name == "websafeSessionKey" and hasattr(conf_sess, "key"):
                    setattr(cf, field.name, str(conf_sess.key.urlsafe()))
            if displayName:
                setattr(cf, 'speakerDisplayName', displayName)
        cf.check_initialized()
        return cf

    def toProfileForm(self, prof):
        """Copy relevant fields from Profile to ProfileForm."""
        pf = ProfileForm()
        for field in pf.all_fields():
            if hasattr(prof, field.name):
                # convert t-shirt string to Enum; just copy others
                if field.name == 'teeShirtSize':
                    setattr(pf, field.name, getattr(TeeShirtSize, getattr(prof, field.name)))
                else:
                    setattr(pf, field.name, getattr(prof, field.name))
        pf.check_initialized()
        return pf

    def toSpeakerForm(self, speaker, displayName=None, websafeSpeakerKey=None):
        """Copy relevant fields from Speaker to SpeakerForm."""
        sp = SpeakerForm()
        for field in ('sessionKeysToSpeakAt', 'mainEmail', 'displayName', 'websafeSpeakerKey'):
            if hasattr(speaker, field):
                setattr(sp, field, getattr(speaker, field))
            elif field == 'websafeSpeakerKey' and hasattr(speaker, 'key'):
                setattr(sp, field, speaker.key.urlsafe())
        if displayName:
            setattr(sp, 'displayName', displayName)
        if websafeSpeakerKey:
            setattr(sp, 'websafeSpeakerKey', websafeSpeakerKey)
        sp.check_initialized()
        return sp

    def toWishlistForm(self, wish=None):
        """Copy relevant fields from Wishlist to WishlistForm."""
        wl = WishlistForm()
        if wish:
            for sess in wish.get('sessions'):
                wl.sessions.append(self.toConferenceSessionForm(sess))
        wl.check_initialized()
        return wl
