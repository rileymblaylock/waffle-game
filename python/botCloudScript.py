from datetime import date
import json
f_date = date(2022, 4, 9)
l_date = date.today()
delta = l_date - f_date
#print(str(delta.days))
#print('{ "text": "WAFFLE #' + str(delta.days) +' 1/6\n🧇🧇🧇🧇🧇" }')

import base64
import requests
import requests_oauthlib
from requests_oauthlib import OAuth1
import os
import json
from datetime import date

consumer_key = ""
consumer_secret = ""
access_token = ""
token_secret = ""

def connect_to_oauth(consumer_key, consumer_secret, acccess_token, token_secret):
   url = "https://api.twitter.com/2/tweets"
   auth = OAuth1(consumer_key, consumer_secret, acccess_token, token_secret)
   return url, auth
      
def hello_pubsub():
    f_date = date(2022, 4, 9)
    l_date = date.today()
    delta = l_date - f_date
    payload = { 
        "text": "WAFFLE #" + str(delta.days) + " 1/6\n🧇🧇🧇🧇🧇"
        }
    #payload = { 
    #    "text": "test"
    #    }
    url, auth = connect_to_oauth(
          consumer_key, consumer_secret, access_token, token_secret
    )
    request = requests.post(
          auth=auth, url=url, json=payload, headers={"Content-Type": "application/json"}
    )
    print(request.content)

hello_pubsub()