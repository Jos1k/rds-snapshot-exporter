import { SQSEvent } from "aws-lambda";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const buildSqsEvent = (eventBody: any): SQSEvent => {
  const message: SQSEvent = {
    Records: [
      {
        messageId: "",
        receiptHandle: `Receipt`,
        body: JSON.stringify(eventBody),
        attributes: {
          ApproximateReceiveCount: "3",
          SentTimestamp: "123123123123",
          SenderId: "123123123123",
          ApproximateFirstReceiveTimestamp: "1529104986230"
        },
        messageAttributes: {
          traceId: {
            dataType: "String",
            stringValue: "",
            stringListValues: [] as never[],
            binaryListValues: [] as never[]
          }
        },
        md5OfBody: "",
        eventSource: "aws:sqs",
        eventSourceARN: "arn:aws:sqs:eu-west-1:123123123123:NOTFIFOQUEUE",
        awsRegion: "eu-west-1"
      }
    ]
  };
  return message;
};
