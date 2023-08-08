import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import crypto from 'crypto';

const { TABLE_NAME, PRIMARY_KEY, API_KEY, AUTH_HEADER, SORT_KEY, BENCHMARK_KEY, AWS_REGION } = process.env;

const client = new DynamoDBClient({ region: AWS_REGION });

export const handler = async (event) => {
  const { requestContext: { http: { method, path }, timeEpoch}, body, headers} = event;

  if (method !== 'POST') {
    return {
      statusCode: 405,  
      body: JSON.stringify({ message: 'Method not allowed' }),  
    };
  }

  if (!headers[AUTH_HEADER]) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Unauthorized' }),
    };
  }

  if (headers[AUTH_HEADER] !== API_KEY) {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: 'Forbidden' }),
    };
  }

  const benchmarkId = path.substring(1);

  const params = {
    TableName: TABLE_NAME,
    Item: {
      [PRIMARY_KEY]: { S: crypto.randomUUID() },
      [SORT_KEY]: { N: timeEpoch.toString() },
      [BENCHMARK_KEY]: { S: benchmarkId },
      data: { S: body },
    },
  };

  try {
    await client.send(new PutItemCommand(params));
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }


  // TODO implement
  const response = {
    statusCode: 200,
    body: JSON.stringify({ message: 'Success' }),
  };
  return response;
};