App Engine application for the Udacity training course.

## Products
- [App Engine][1]

## Language
- [Python][2]
- [AngularJS][7]

## APIs
- [Google Cloud Endpoints][3]

## Summary
This project corresponds to the [Udacity Full Stack Web Developer Nanodegree][4]
course called "Developing Scalable Apps in Python" and explores the Google App
Engine as a platform. It is intended to demonstrate a grasp of server-side scripting
in Python (leveraging the Google App Engine library), database modeling in Big Table,
and client-side scripting in AngularJS. 

This project began as a template that students are expected to clone and then build
upon, so the code containe herein is not drawn up from scratch. In particular,
the functionality for a _Conference_ entity and for the user _Profile_ entity were
carved out beforehand, but it was the task of the student to implement _Conference Session_,
_Speaker_, and _Wishlist_ entities.

The inheritance and key-linking patterns in the Google App Engine and Big Table
technologies is different than in SQL database design or in Object Oriented Programming,
and so requires a different understanding and workflow.

For this project, an end-user is expected to be able to log into the site with their
OAuth credentials (in this case, Google+) and view the many Conferences they can
register to attend. Additionally, they can view individual sessions scheduled for
any given Conference and see who the keynote speaker will be. Any session can be added
to or removed from their Wishlist. Conferences can be filtered on a variety of options
and Sessions can be filtered by Type or by Speaker.

## Additional Functionality

To expand upon the basic functionality of the site, the ability to add Speakers,
remove Conferences and Conference Sessions was added as well.

Although it was optional, the user interface for the required API functionality was
created. So you may fire up the site and experiment with all of the above-mentioned
functionality directly in the browser.

The ability to view all speakers (separate of their registered sessions) was a 
useful piece of functionality as it supported adding in a grid view and menu for
users to view and lookup speakers. Following from that, the ability to look up a
Speaker individually and to remove them, were added as additional queries too.

Also, functionality was added to list all Conference Sessions (this was also
implemented with a user interface that the user can navigate to) and also
to view all the Conference Sessions from the Conference Detail page. The 
Conference Detail page was also given a Delete Conference button and supporting
API functionality and so was the Conference Session page given Delete functionality.

## Problem Query Challenge
For the assignment, one question posed to the student was to identify a flaw with
a particular use-case and describe a possible solution. The challenge was to 
discover a way to filter out Sessions of the __workshop__ type and also any session
happening after 7 o'clock at night. The difficulty lies in Datastore rejecting
queries that use inequality on more than one property. In this case, both `typeOfSession`
and `startTime` have to be checked for values that affect the returned rows. The
problem was solved by using an `IN()` operator for session types (specifying only
those that are accepted rather than excluding the one un-acceptable value) in combination
with an inequality operator for time of day, afterwards. 


# Entities

## Session Entity
The _ConferenceSession_ was designed with a mix of data types that help adapt to the
variety of input a user may enter. Fields that could be restricted (such as the date,
type and duration in minutes) were set as Date, Enum or Integer. Other fields were
left as string to adjust for the expected variety. The start time was an ideal 
candidate for a TimeProperty and this became even more necessary when trying to
solve the challenge query.

# Speaker Entity
At first it seemed that inheriting from the user _Profile_ would be the most sensible,
however it became apparent that I would need multiple OAuth accounts to seed several
speakers. And it didn't seem that certain fields (such as T-Shirt size) which are
present on _Profile_ would be necessary on _Speaker_. Instead, a simpler version of
_Profile_ was created, with just the user email, display name, and a link to all
the _ConferenceSession_ being scheduled to speak at. The _SpeakerForm_ could then
follow suite with existing patterns of holding a websafeKey to uniquely identify.

# Wishlist Entity
The simplest design worked out best in this case, where a collection of _ConferenceSession_
entities and an ancestral key to the associated user _Profile_ were all that was
needed for easiest querying and serialization/de-serialization. The urlsafe unique
key was easily able to be converted into a full _ConferenceSessionForm_ for each session
placed into the wishlist.

## Installation Instructions
If you wish to run this application locally, you'll need to install the Google Cloud
SDK and then issue a `~/.google_appengine/dev_appserver.py app/.` from the command
prompt (you'll need to be in the project root folder). Next you can open your 
browser to [localhost:8080][5] and begin using the site (start by logging in).

If you wish instead to view the deployed version of this site, please visit
[this link][6].

## Setup Instructions
This application was forked from a template and customized to complete the requirements of the Udacity Full Stack Developer nanodegree. These steps were followed to setup the project on the Google app engine after finishing coding. So these steps can be followed by yourself if you wish to deploy this project as-is onto the Google App Engine.

1. Make sure the Google App Engine SDK for Python is installed (see [instructions][10])
1. Update the value of `application` in `app.yaml` to the app ID you
   have registered in the App Engine admin console and would like to use to host
   your instance of this sample.
1. Update the values at the top of `settings.py` to
   reflect the respective client IDs you have registered in the
   [Developer Console][8].
1. Update the value of CLIENT_ID in `static/js/app.js` to the Web client ID
1. (Optional) Mark the configuration files as unchanged as follows:
   `$ git update-index --assume-unchanged app.yaml settings.py static/js/app.js`
1. Run the app with the devserver using `dev_appserver.py DIR`, and ensure it's running by visiting your local server's address (by default [localhost:8080][5].)
1. (Optional) Generate your client library(ies) with [the endpoints tool][9].
1. Deploy your application.

[1]: https://developers.google.com/appengine
[2]: http://python.org
[3]: https://developers.google.com/appengine/docs/python/endpoints/
[4]: https://www.udacity.com/course/full-stack-web-developer-nanodegree--nd004
[5]: https://localhost:8080/
[6]: https://fluent-music-116517.appspot.com
[7]: https://angularjs.org/
[8]: https://console.developers.google.com/
[9]: https://developers.google.com/appengine/docs/python/endpoints/endpoints_tool
[10]: https://cloud.google.com/appengine/downloads?hl=en#Google_App_Engine_SDK_for_Python