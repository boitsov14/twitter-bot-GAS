function make_reply() {
  const twitter = getTwitterService()
  if (twitter.hasAccess()) {
    Logger.log('Searching for replies...')
    const SINCE_ID = PropertiesService.getScriptProperties().getProperty('SINCE_ID')
    const url_twitter = `https://api.twitter.com/2/users/1493111775042043904/mentions?expansions=author_id&user.fields=username&since_id=${SINCE_ID}`
    const response_twitter = JSON.parse(twitter.fetch(url_twitter).getContentText())
    if (response_twitter.meta.result_count === 0) return

    const tweets = response_twitter.data.filter(tweet => tweet.text.startsWith('@sequent_bot'))
    if (Object.keys(tweets).length === 0) {
      PropertiesService.getScriptProperties().setProperty('SINCE_ID', response_twitter.meta.newest_id)
      return
    }

    const users = response_twitter.includes.users
    const id_to_username = new Object()
    for (const user of users) {
      id_to_username[user.id] = user.username
    }
    for (const tweet of tweets) {
      tweet.username = id_to_username[tweet.author_id]
      delete tweet.author_id
    }

    Logger.log(tweets)
    const send_data = {
      'tweets': tweets,
      'password': PropertiesService.getScriptProperties().getProperty('PASSWORD')
    }
    const options = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify(send_data)
    }
    const url = PropertiesService.getScriptProperties().getProperty('URL') + '/twitter_bot'
    const response = UrlFetchApp.fetch(url, options)
    Logger.log(response.getContentText())
    PropertiesService.getScriptProperties().setProperty('SINCE_ID', response_twitter.meta.newest_id)
  } else {
    Logger.log('Error: Cannot access twitter.')
  }
}

function getTwitterService() {
  const url = 'https://api.twitter.com/oauth/authorize'
  const API_KEY = PropertiesService.getScriptProperties().getProperty('API_KEY')
  const API_KEY_SECRET = PropertiesService.getScriptProperties().getProperty('API_KEY_SECRET')
  const ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('ACCESS_TOKEN')
  const ACCESS_TOKEN_SECRET = PropertiesService.getScriptProperties().getProperty('ACCESS_TOKEN_SECRET')
  return OAuth1.createService('Twitter')
    .setAuthorizationUrl(url)
    .setConsumerKey(API_KEY)
    .setConsumerSecret(API_KEY_SECRET)
    .setAccessToken(ACCESS_TOKEN, ACCESS_TOKEN_SECRET)
}
