function make_reply() {

  Logger.log('Searching')

  // ツイートの取得
  const since_id = PropertiesService.getScriptProperties().getProperty('SINCE_ID')
  const twitter_url = `https://api.twitter.com/2/users/1493111775042043904/mentions?expansions=author_id&tweet.fields=created_at&user.fields=username&since_id=${since_id}`
  const twitter_options = {
    'headers': {
      'Authorization': 'Bearer ' + PropertiesService.getScriptProperties().getProperty('BEARER_TOKEN')
    }
  }
  const twitter_response = JSON.parse(UrlFetchApp.fetch(twitter_url, twitter_options).getContentText())
  Logger.log(twitter_response)

  // ツイート数が0なら終了
  if (twitter_response.meta.result_count === 0) return

  // author idとusernameを対応づける
  const id_to_username = {}
  for (const user of twitter_response.includes.users) {
    id_to_username[user.id] = user.username
  }

  // ツイートを古い順にする
  twitter_response.data.reverse()

  for (const tweet of twitter_response.data) {

    // ツイートが@sequent_botから始まらない場合は無視
    if (!tweet.text.startsWith('@sequent_bot')) {
      update_since_id(tweet.id)
      continue
    }

    // ツイートが5分前までに生成されたものである場合は終了
    if (new Date().getTime() - Date.parse(tweet.created_at) < 5 * 60 * 1000) {
      return
    }

    // ツイートがstreaming apiの方で検知済みなら無視
    const backup_url = PropertiesService.getScriptProperties().getProperty('BACKUP_URL') + '?id=' + tweet.id
    if (JSON.parse(UrlFetchApp.fetch(backup_url).getContentText())) {
      Logger.log('Already replied')
      update_since_id(tweet.id)
      continue
    }

    // 送信するツイートの設定
    const payload = {
      'id': tweet.id,
      'username': id_to_username[tweet.author_id],
      'text': tweet.text
    }
    Logger.log(payload)

    // ツイートの送信
    const options = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify(payload),
      'headers': {
        'Authorization': 'Bearer ' + PropertiesService.getScriptProperties().getProperty('PASSWORD')
      }
    }
    const url = PropertiesService.getScriptProperties().getProperty('URL') + '/twitter'
    const response = UrlFetchApp.fetch(url, options)
    Logger.log(response.getContentText())
    update_since_id(tweet.id)

    // 1トリガーにつきツイートは1回のみで終了
    // エラー記録を残すため例外で落とす
    throw new Error('Not replied')
  }
}

function update_since_id(since_id) {
  PropertiesService.getScriptProperties().setProperty('SINCE_ID', since_id)
}
