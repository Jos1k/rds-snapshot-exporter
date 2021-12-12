import { Handler } from "aws-lambda";
import { v4 as uuidv4 } from 'uuid';
import middy = require("middy");
import * as AWS from "aws-sdk";
import { ALLOWED_EVENTS } from "../libs/allowedEvents";
import { getAllowedSourcePrefixes } from "../libs/isSourceAllowed";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const processEvent: Handler<any, void> = async (request: any) => {
	console.info("rds-s3-exporter.started");

	const record = request.Records[0];
	const event = JSON.parse(record.body);

	if(!isSourceAllowed(event["Source ID"])){
		console.info("rds-s3-exporter.skipped.notsupportedsource", {
			eventSource: event["Source ID"]
		});
		return;
	}

	if(!isTypeAllowed(event['Event Message'])){
		console.info("rds-s3-exporter.skipped.notsupportedtype", {
			eventType: event["Event Message"]
		});
		return;
	}

	const rds = new AWS.RDS({region: process.env.REGION});
	await rds.startExportTask({
		ExportTaskIdentifier: `database-backup-${uuidv4()}`,
		SourceArn: event["Source ARN"],
		S3BucketName: process.env.DATABASE_BACKUPS_BUCKET || "",
		IamRoleArn: process.env.IAM_ROLE || "",
		KmsKeyId: process.env.KMS_KEY_ID || ""
	}).promise().then(data =>{
		console.info("rds-s3-exporter.status", data);
		console.info("rds-s3-exporter.success");
	})
};

const isSourceAllowed = (sourceId: string) => getAllowedSourcePrefixes(process.env.CONFIG_STAGE || "")
	.some(prefix => sourceId
		.toUpperCase()
		.startsWith(prefix.toUpperCase())
	)

const isTypeAllowed = (eventType: string) => ALLOWED_EVENTS.includes(eventType);

export const main = middy(processEvent)
	.use({
		onError: (context, callback) => {
			console.error("rds-s3-exporter.error", context.error);
			callback(context.error);
		}
	})
