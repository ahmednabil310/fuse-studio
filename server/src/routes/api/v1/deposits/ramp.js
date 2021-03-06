const router = require('express').Router()
const { initiateDeposit, fulfillDeposit, cancelDeposit, getRampAuthKey } = require('@utils/deposit')
const config = require('config')
const web3Utils = require('web3-utils')
const crypto = require('crypto')
const stableStringify = require('fast-json-stable-stringify')
const yn = require('yn')
const { ZERO_ADDRESS } = require('@utils/network')

const getTxHash = (purchase) => {
  try {
    const { details } = purchase.actions.find(({ newStatus }) => newStatus === 'RELEASING')
    return details
  } catch (err) {
    console.log('Could not extract the txhash from the purchase')
    console.error(err)
  }
}

const rampAuthCheck = (req, res, next) => {
  if (yn(config.get('plugins.rampInstant.webhook.skipAuth'))) {
    console.log('Skipping ramp auth check on the development environment')
    return next()
  }
  if (req.body && req.header('X-Body-Signature')) {
    console.log(`[deposit-rampAuthCheck] X-Body-Signature - ${req.header('X-Body-Signature')}`)
    const verified = crypto.verify(
      'sha256',
      Buffer.from(stableStringify(req.body)),
      getRampAuthKey(),
      Buffer.from(req.header('X-Body-Signature'), 'base64')
    )
    if (verified) {
      console.log(`[deposit-rampAuthCheck] if is true`)
      return next()
    } else {
      console.error('ERROR: Invalid signature')
      res.status(401).send()
    }
  } else {
    console.log(`[deposit-rampAuthCheck] ERROR: Wrong request structure`)
    throw Error('ERROR: Wrong request structure')
  }
}

router.post('/:customerAddress/:communityAddress', rampAuthCheck, async (req, res) => {
  console.log(`[deposit-ramp] req.body: ${JSON.stringify(req.body)}`)
  const provider = 'ramp'
  const network = 'fuse'
  const { customerAddress, communityAddress } = req.params
  const { purchase, type } = req.body
  const { asset: { address, decimals }, cryptoAmount, receiverAddress, id } = purchase
  console.log(`[deposit-ramp] recieved webhook with status ${type}`)
  if (type === 'CREATED') {
    // deposit is issued, on-ramp is waiting for fiat processing
    const requestData = {
      tokenAddress: address ? address.toLowerCase() : ZERO_ADDRESS,
      tokenDecimals: decimals,
      customerAddress,
      communityAddress,
      amount: cryptoAmount,
      externalId: id,
      walletAddress: web3Utils.toChecksumAddress(receiverAddress),
      purchase,
      provider,
      network
    }
    await initiateDeposit(requestData)
    console.log(`[deposit-ramp] after requestDeposit`)
    return res.json({ response: 'ok' })
  } else if (type === 'RELEASED') {
    const transactionHash = getTxHash(purchase)
    await fulfillDeposit({
      transactionHash,
      walletAddress: web3Utils.toChecksumAddress(receiverAddress),
      customerAddress,
      communityAddress,
      tokenAddress: address,
      tokenDecimals: decimals,
      amount: cryptoAmount,
      externalId: id,
      provider,
      purchase
    })
    return res.json({ response: 'ok' })
  } else if (type === 'RETURNED') {
    await cancelDeposit({
      externalId: id,
      provider,
      purchase
    })
    console.log(`[deposit-ramp] after cancelDeposit`)
    return res.json({ response: 'ok' })
  } else {
    console.log(`[deposit-ramp] reached else type - ${type}`)
    return res.json({})
  }
})

module.exports = router
