"use strict";
const axios = require("axios");
const fs = require("fs");
const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();
var bodyParser = require('body-parser');

const abi = require("./abis");
const factoryAddress = require("./address");

require("dotenv").config({});
const Web3 = require("web3");
const providerUrls = [
  'https://bsc-dataseed1.ninicoin.io',
  'https://bsc-dataseed1.defibit.io',
  'https://bsc-dataseed.binance.org/',
]
const random = require ('lodash/random');
const { id } = require("ethers/lib/utils");


router.get('/getReserves/:address',async(req,res) => {
  let response = {}
  response.data = []
  let statusCode = 200

  const resevers = await getReserves(req.params.address);
  if(resevers.length > 0) {

    response.data = [{reserve0: resevers[0],reserve1: resevers[1]}] 
  }

  res.status(statusCode).json(response)
});

router.get('/checkPairToken/:address',async(req,res) => {
  let response = {}
  response.data = ""
  let statusCode = 200

  const token0 = await checkPairToken(req.params.address);
  if(token0) {

    response.data = token0
  }

  res.status(statusCode).json(response)
});

  // CHECK PAIR EXISIT OR NOT //

router.post('/checkPair',async(req,res) => {
  let randomIndex = random(0, providerUrls.length - 1)
  let httpProvider = new Web3.providers.HttpProvider(providerUrls[randomIndex], { timeout: 10000 })
  let web3http = new Web3(httpProvider);

  let response = {}
  response.data = []
  let statusCode = 200

  let PairContractHTTP = new web3http.eth.Contract(
    abi[req.body.exchange].factory,
    factoryAddress.mainnet[req.body.exchange].factory
  );

    response.data = await PairContractHTTP.methods.getPair(req.body.token0,req.body.token1).call();
    
    res.status(statusCode).json(response)
    
});


const checkPairToken = async (address) => {
  let randomIndex = random(0, providerUrls.length - 1)
  let httpProvider = new Web3.providers.HttpProvider(providerUrls[randomIndex], { timeout: 10000 })
  let web3http = new Web3(httpProvider);

  let PairContractHTTP = new web3http.eth.Contract(
    abi.resevers.abi,
    address.toString()
  );
  return new Promise(async (relsove,rejects) => {

    const token0 = await PairContractHTTP.methods.token0().call();

    if(token0){
      relsove(token0)
    } else {
      resolve()
    }
  })

}
const getReserves = async (address) => {
  let randomIndex = random(0, providerUrls.length - 1)
  let httpProvider = new Web3.providers.HttpProvider(providerUrls[randomIndex], { timeout: 10000 })
  let web3http = new Web3(httpProvider);

  let PairContractHTTP = new web3http.eth.Contract(
    abi.resevers.abi,
    address.toString()
  );
  return new Promise(async (relsove,rejects) => {

    const _reserves = await PairContractHTTP.methods.getReserves().call();

    if(_reserves){
      relsove([_reserves.reserve0,_reserves.reserve1])
    } else {
      resolve([])
    }
  })

}


router.get('/allPairs/:exchange',async(req,res) => {
  let response = {}
  response.data = []
  let statusCode = 200
  let data ;
  if(req.params.exchange == "PANCAKESWAP"){
    data = await getPancakePairs();
  } else if(req.params.exchange == "APESWAP") {
    data = await getApePairs();
  }
  else {
    data = []
  }

  response.totalCount = data.length
  response.status = "SUCCESS";
  response.data = data
  res.status(statusCode).json(response)
});


const getPancakePairs = async () => {
  let skip = 0;
  let take = 100;
  let data = []
  let id ='';
  do {
    if(data.length > 0) {
      id = data[data.length -1].id
    }
      let result = await axios.post(
        // "https://api.thegraph.com/subgraphs/name/pancakeswap/pairs",
        "https://bsc.streamingfast.io/subgraphs/name/pancakeswap/exchange-v2",
        {
          query: `
            {
              pairs(first: ${take},where: {
                id_gt: "${id}",reserveUSD_gt: "100000",
                volumeUSD_gt: "5000"
              }) {
                id
                token0 {
                  id
                  symbol
                  decimals
                }
                token1 {
                  id
                  symbol
                  decimals
                }
              }
            }          
          `,
        }
      );
      if (result.data.data) {
         if(result.data.data.pairs.length > 0){
           data.push(...result.data.data.pairs)
         } 
      }
      skip= skip+take;
      console.log(skip)
      // if(skip >= 100){
      //   skip = skip+2000;
      // }
  }
  while (data.length >= skip);
  fs.writeFileSync('./datas.txt', JSON.stringify(data))
  return data
}
const getApePairs = async () => {
  let skip = 0;
  let take = 1000;
  let data = []
  do {
      let result = await axios.post(
        "https://graph.apeswap.finance/subgraphs/name/ape-swap/apeswap-subgraph",
        {
          query: `
            {
              pairs(first: ${take},skip : ${skip},
                where: {
                  reserveUSD_gt: "100000", 
                  volumeUSD_gt: "5000",
                }) {
                id
                token0 {
                  id
                  symbol
                  decimals
                }
                token1 {
                  id
                  symbol
                  decimals
                }
              }
            }          
          `,
        }
      );
      if (result.data.data.pairs.length > 0) {
        data.push(...result.data.data.pairs)
      }
      skip= skip+1000;
    
  }
  while (data.length >= skip);
  return data
}

app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.urlencoded({ limit: '5mb', extended: false }));
app.use('/', router);
app.listen(5000, () => {
  console.log("Server running on port 5000");
 });