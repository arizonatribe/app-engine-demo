#!/usr/bin/env python

import endpoints
from protorpc import messages
from protorpc import message_types

from models import ConferenceForm
from models import ConferenceSessionForm
from models import SpeakerForm
from models import WishlistForm
from models import SessionType

# Replace the following lines with client IDs obtained from the APIs
# Console or Cloud Console.
WEB_CLIENT_ID = '860836366947-mlvo10kihl013im6sah3dm4rc1b7mp95.apps.googleusercontent.com'
ANDROID_CLIENT_ID = 'replace with Android client ID'
IOS_CLIENT_ID = 'replace with iOS client ID'
ANDROID_AUDIENCE = WEB_CLIENT_ID

EMAIL_SCOPE = endpoints.EMAIL_SCOPE
API_EXPLORER_CLIENT_ID = endpoints.API_EXPLORER_CLIENT_ID
MEMCACHE_ANNOUNCEMENTS_KEY = "RECENT_ANNOUNCEMENTS"

DEFAULTS = {
    "city": "Default City",
    "maxAttendees": 0,
    "seatsAvailable": 0,
    "topics": ["Default", "Topic"]
}

SESSION_DEFAULTS = {
    "typeOfSession": SessionType.LECTURE,
    "duration": 60,
    "startTime": "10:30 AM"
}

OPERATORS = {
    'EQ':   '=',
    'GT':   '>',
    'GTEQ': '>=',
    'LT':   '<',
    'LTEQ': '<=',
    'NE':   '!='
}

FIELDS = {
    'CITY': 'city',
    'TOPIC': 'topics',
    'MONTH': 'month',
    'MAX_ATTENDEES': 'maxAttendees'
}

CONF_GET_REQUEST = endpoints.ResourceContainer(
    message_types.VoidMessage,
    websafeConferenceKey=messages.StringField(1),
)

SESS_BY_TYPE_GET_REQUEST = endpoints.ResourceContainer(
    message_types.VoidMessage,
    sessionType=messages.StringField(1),
)

CONF_BY_TYPE_GET_REQUEST = endpoints.ResourceContainer(
    message_types.VoidMessage,
    websafeConferenceKey=messages.StringField(1),
    sessionType=messages.StringField(2)
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
