const { Router } = require('express')
const request = require('request')
const medium = require('medium-sdk')

const router = Router()

const client = new medium.MediumClient({
  clientId: 'd80530a3a083',
  clientSecret: '468fa111f45ed81d9b57c2c96cfcb7dd0c14b790'
})

const redirectURL = 'http://ddcf994e.ngrok.io/callback/medium'

function index (req, res, next) {
  return request({
    url: 'https://medium.com/@khriztianmoreno/latest',
    json: true
  }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      // We need to pull out the text that comes thru from Medium for JSON hacking
      const jsonBody = JSON.parse(body.replace('])}while(1);</x>', ''))
      return res.status(200).json(jsonBody)
    }

    return res.status(500).json(error)
  })
}

function callback (req, res, next) {
  const { code } = req.query
  // En el cliente recibirlo y guardarlo en el store
  return res.status(200).json({ code })
}

function create (req, res, next) {
  const { title, content, code } = req.body

  client.exchangeAuthorizationCode(code, redirectURL, (err, token) => {
    if (err) throw err
    client.getUser((err, user) => {
      if (err) throw err
      client.createPost({
        userId: user.id,
        title,
        contentFormat: medium.PostContentFormat.HTML,
        content,
        publishStatus: medium.PostPublishStatus.DRAFT
      }, (err, post) => {
        if (err) throw err
        console.log(token, user, post)
      })
    })
  })
}

function detail (req, res, next) {
  const { id } = req.params

  return request({
    url: `https://medium.com/@khriztianmoreno/${id}`,
    json: true
  }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      // We need to pull out the text that comes thru from Medium for JSON hacking
      const jsonBody = JSON.parse(body.replace('])}while(1);</x>', ''))
      return res.status(200).json(jsonBody)
    }

    return res.status(500).json(error)
  })
}

/* GET medium  listing. */
router.get('/medium/', index)
router.get('/medium/callback', callback)
router.get('/medium/:id', detail)

router.post('/medium/', create)

module.exports = router
