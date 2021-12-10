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
	"Source ARN": "arn:aws:rds:eu-west-1:123123123123:snapshot:rds:db-dev-test-2021-11-26-16-10",
	"Event ID": "http://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_Events.html#RDS-EVENT-0091",
	"Event Message": "Manual snapshot created"
}

const CONFIG_STAGE = "dev";

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
		rdsStartExportTaskStub.throws({ error: "super serious error" });
		AWS.mock("RDS", "startExportTask", rdsStartExportTaskStub);
		process.env.CONFIG_STAGE = CONFIG_STAGE;
	});

	after(() => {
		delete process.env.CONFIG_STAGE;
		sandbox.restore();
		// console._resetLogger();
		AWS.restore();
	});

	describe("GIVEN processEvent receives an event", () => {
		describe("WHEN the event message is in allowed event list", () => {
			let errorResponse: Error;
			before(async () => {
				// eslint-disable-next-line @typescript-eslint/no-empty-function
				try{
					await main(buildSqsEvent(sampleAllowedEvent), {} as Context)
				}
				catch(error){
					errorResponse = error;
					console.error(`ERROR: ${errorResponse}`);
				}
			});

			it("SHOULD log error message ", () => {
				expect(journalSpy).to.have.been.calledWithMatch(
					{
						level: "Error",
						name: "rds-s3-exporter.error",
						errorMessage: { error: 'super serious error' }
					}
				)
			});
		});
	});
});