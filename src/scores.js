const AWS = require('aws-sdk');

const region = process.env.AWS_REGION || 'ap-northeast-2';
const tableName = process.env.SCORES_TABLE || 'atx-test-scores';

const docClient = new AWS.DynamoDB.DocumentClient({ region });
const dynamodb = new AWS.DynamoDB({ region, apiVersion: '2012-08-10' });

async function putScore(player, score, level) {
  const params = {
    TableName: tableName,
    Item: {
      player: player,
      score: score,
      level: level,
      createdAt: new Date().toISOString()
    }
  };
  const result = await docClient.put(params).promise();
  return result;
}

async function getPlayerBest(player) {
  const params = {
    TableName: tableName,
    KeyConditionExpression: 'player = :p',
    ExpressionAttributeValues: {
      ':p': player
    },
    ScanIndexForward: false,
    Limit: 1
  };
  const data = await docClient.query(params).promise();
  if (!data.Items || data.Items.length === 0) {
    return null;
  }
  return data.Items[0];
}

async function getTopScores(limit) {
  const params = {
    TableName: tableName,
    Limit: limit || 10
  };
  const data = await docClient.scan(params).promise();
  const items = data.Items || [];
  items.sort(function (a, b) {
    return b.score - a.score;
  });
  return items.slice(0, limit || 10);
}

function tableExists(callback) {
  dynamodb.describeTable({ TableName: tableName }, function (err, data) {
    if (err) {
      callback(err, false);
      return;
    }
    callback(null, data.Table.TableStatus === 'ACTIVE');
  });
}

module.exports = {
  putScore,
  getPlayerBest,
  getTopScores,
  tableExists
};
