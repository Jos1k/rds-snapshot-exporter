"use strict";
import "mocha";
import { main as middyHandler } from '../../src/functions/backup';
import { Context } from 'aws-lambda';
import { SinonSandbox, SinonSpy, SinonStub } from "sinon";
import { buildSqsEvent } from "../lib/buildSqsEvent";

const AWS = require("aws-sdk-mock");
const sinon = require("sinon");
const expect = require("chai").use(require("sinon-chai")).use(require("chai-as-promised")).expect;

const sampleAllowedEvent = {
	"Event Source": "db-snapshot",
	"Event Time": "2021-11-26 16:11:39.735",
	"Identifier Link": "someLink",
	"Source ID": "rds:db-dev-test-2021-11-26-16-10",
	"Source ARN": "arn:aws:rds:eu-west-1:1231231231231:snapshot:rds:db-dev-test-2021-11-26-16-10",
	"Event ID": "http://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_Events.html#RDS-EVENT-0091",
	"Event Message": "Manual snapshot created"
}

const DATABASE_BACKUPS_BUCKET = "test_s3_bucket_name";
const IAM_ROLE = "test_iam_role";
const KMS_KEY_ID = "test_kms_key_id";
const CONFIG_STAGE = "ppe";

const main = (event: any, context: Context) => {
	return new Promise((resolve, reject) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		middyHandler(event as any, context, (error: any) => {
			if (error) {
				reject(error);
			} else {
				resolve({});
			}
		});
	});
};

describe("Backup", () => {
	let rdsStartExportTaskStub: SinonStub;

	const sandbox: SinonSandbox = sinon.createSandbox();
	const journalSpy: SinonSpy = sandbox.spy();

	before(() => {
		// console._setLogger(journalSpy);
		rdsStartExportTaskStub = sandbox.stub();
		rdsStartExportTaskStub.returns({ status: "Starting" });
		AWS.mock("RDS", "startExportTask", rdsStartExportTaskStub);

		process.env.DATABASE_BACKUPS_BUCKET = DATABASE_BACKUPS_BUCKET;
		process.env.IAM_ROLE = IAM_ROLE;
		process.env.KMS_KEY_ID = KMS_KEY_ID;
		process.env.CONFIG_STAGE = CONFIG_STAGE;
	});

	after(() => {

		delete process.env.DATABASE_BACKUPS_BUCKET;
		delete process.env.IAM_ROLE;
		delete process.env.KMS_KEY_ID;
		delete process.env.CONFIG_STAGE;

		sandbox.restore();
		// console._resetLogger();
		AWS.restore();
	});

	describe("GIVEN processEvent receives an event", () => {
		describe("WHEN the event message is in allowed event list", () => {
			before(async () => {
				// eslint-disable-next-line @typescript-eslint/no-empty-function
				await main(buildSqsEvent(sampleAllowedEvent), {} as Context)
			});

			it("SHOULD log success log the message ", () => {
				expect(journalSpy).to.have.been.calledWithMatch(
					{
						level: "Info",
						name: "rds-s3-exporter.success",
					}
				)
			});

			it("SHOULD log status log the message ", () => {
				expect(journalSpy).to.have.been.calledWithMatch(
					{
						level: "Info",
						name: "rds-s3-exporter.status",
						status: "Starting"
					}
				)
			});

			it("SHOULD call startExportTask aws sdk function", () => {
				expect(rdsStartExportTaskStub).to.have.been.calledWithMatch({
					SourceArn: sampleAllowedEvent["Source ARN"],
					S3BucketName: DATABASE_BACKUPS_BUCKET,
					IamRoleArn: IAM_ROLE,
					KmsKeyId: KMS_KEY_ID
				})
			})
		});
	});
});