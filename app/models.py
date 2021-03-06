#!/usr/bin/env python

import httplib
import endpoints
from protorpc import messages
from google.appengine.ext import ndb


class ConflictException(endpoints.ServiceException):
    """ConflictException -- exception mapped to HTTP 409 response"""
    http_status = httplib.CONFLICT


class Profile(ndb.Model):
    """Profile -- User profile object"""
    displayName = ndb.StringProperty()
    mainEmail = ndb.StringProperty()
    teeShirtSize = ndb.StringProperty(default='NOT_SPECIFIED')
    conferenceKeysToAttend = ndb.StringProperty(repeated=True)


class ProfileMiniForm(messages.Message):
    """ProfileMiniForm -- update Profile form message"""
    displayName = messages.StringField(1)
    teeShirtSize = messages.EnumField('TeeShirtSize', 2)


class ProfileForm(messages.Message):
    """ProfileForm -- Profile outbound form message"""
    displayName = messages.StringField(1)
    mainEmail = messages.StringField(2)
    teeShirtSize = messages.EnumField('TeeShirtSize', 3)
    conferenceKeysToAttend = messages.StringField(4, repeated=True)


class ProfileForms(messages.Message):
    """ProfileForms -- multiple Profile outbound form message"""
    profiles = messages.MessageField(ProfileForm, 1, repeated=True)
    

class BooleanMessage(messages.Message):
    """BooleanMessage-- outbound Boolean value message"""
    data = messages.BooleanField(1)
    

class StringMessage(messages.Message):
    """StringMessage-- outbound (single) string message"""
    data = messages.StringField(1, required=True)


class Conference(ndb.Model):
    """Conference -- Conference object"""
    name            = ndb.StringProperty(required=True)
    description     = ndb.StringProperty()
    organizerUserId = ndb.StringProperty()
    topics          = ndb.StringProperty(repeated=True)
    city            = ndb.StringProperty()
    startDate       = ndb.DateProperty()
    month           = ndb.IntegerProperty()
    endDate         = ndb.DateProperty()
    maxAttendees    = ndb.IntegerProperty()
    seatsAvailable  = ndb.IntegerProperty()


class ConferenceForm(messages.Message):
    """ConferenceForm -- Conference outbound form message"""
    name            = messages.StringField(1)
    description     = messages.StringField(2)
    organizerUserId = messages.StringField(3)
    topics          = messages.StringField(4, repeated=True)
    city            = messages.StringField(5)
    startDate       = messages.StringField(6) #DateTimeField()
    month           = messages.IntegerField(7, variant=messages.Variant.INT32)
    maxAttendees    = messages.IntegerField(8, variant=messages.Variant.INT32)
    seatsAvailable  = messages.IntegerField(9, variant=messages.Variant.INT32)
    endDate         = messages.StringField(10) #DateTimeField()
    websafeConferenceKey      = messages.StringField(11)
    organizerDisplayName = messages.StringField(12)


class ConferenceForms(messages.Message):
    """ConferenceForms -- multiple Conference outbound form message"""
    items = messages.MessageField(ConferenceForm, 1, repeated=True)


class ConferenceSession(ndb.Model):
    """ConferenceSession -- Session object"""
    name            = ndb.StringProperty(required=True)
    highlights      = ndb.StringProperty()
    speakerUserId   = ndb.StringProperty()
    startTime       = ndb.TimeProperty()
    duration        = ndb.IntegerProperty()
    typeOfSession   = ndb.StringProperty(default='UNKNOWN')
    date            = ndb.DateProperty()


class ConferenceSessionForm(messages.Message):
    """ConferenceSessionForm -- Session outbound form message"""
    name            = messages.StringField(1)
    highlights      = messages.StringField(2)
    speakerUserId   = messages.StringField(3)
    startTime       = messages.StringField(4)
    duration        = messages.IntegerField(5, variant=messages.Variant.INT32)
    typeOfSession   = messages.EnumField('SessionType', 6)
    date            = messages.StringField(7) #DateTimeField()
    websafeSessionKey      = messages.StringField(8)
    speakerDisplayName = messages.StringField(9)


class ConferenceSessionForms(messages.Message):
    """ConferenceSessionForms -- multiple Session outbound form message"""
    items = messages.MessageField(ConferenceSessionForm, 1, repeated=True)


class SessionType(messages.Enum):
    """SessionType -- category of conference session, enumeration value"""
    UNKNOWN = 1
    WORKSHOP = 2
    LECTURE = 3
    KEYNOTE = 4
    MEETUP = 5


class TeeShirtSize(messages.Enum):
    """TeeShirtSize -- t-shirt size enumeration value"""
    NOT_SPECIFIED = 1
    XS_M = 2
    XS_W = 3
    S_M = 4
    S_W = 5
    M_M = 6
    M_W = 7
    L_M = 8
    L_W = 9
    XL_M = 10
    XL_W = 11
    XXL_M = 12
    XXL_W = 13
    XXXL_M = 14
    XXXL_W = 15


class Speaker(ndb.Model):
    """Speaker -- User profile object"""
    displayName = ndb.StringProperty()
    mainEmail = ndb.StringProperty(required=True)
    sessionKeysToSpeakAt = ndb.StringProperty(repeated=True)


class SpeakerForm(messages.Message):
    """SpeakerForm -- Profile outbound form message"""
    displayName = messages.StringField(1)
    mainEmail = messages.StringField(2)
    sessionKeysToSpeakAt = messages.StringField(3, repeated=True)
    websafeSpeakerKey = messages.StringField(4)


class SpeakerForms(messages.Message):
    """SpeakerForms -- multiple Speaker outbound form message"""
    speakers = messages.MessageField(SpeakerForm, 1, repeated=True)


class Wishlist(ndb.Model):
    """Wishlist -- collection of ConferenceSession desired to attend by a user"""
    sessions = ndb.StringProperty(repeated=True)


class WishlistForm(messages.Message):
    """WishlistForm -- Wishlist outbound form message"""
    sessions = messages.MessageField(ConferenceSessionForm, 1, repeated=True)


class ConferenceQueryForm(messages.Message):
    """ConferenceQueryForm -- Conference query inbound form message"""
    field = messages.StringField(1)
    operator = messages.StringField(2)
    value = messages.StringField(3)


class ConferenceQueryForms(messages.Message):
    """ConferenceQueryForms -- multiple ConferenceQueryForm inbound form message"""
    filters = messages.MessageField(ConferenceQueryForm, 1, repeated=True)

