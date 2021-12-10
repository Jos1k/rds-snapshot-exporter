"use strict";
import "mocha";
import { main as middyHandler } from '../../src/functions/backup';
import { Context } from 'aws-lambda';
import { SinonSandbox, SinonSpy } from "sinon";
import { buildSqsEvent } from "../lib/buildSqsEvent";

const sinon = require("sinon");
const expect = require("chai").use(require("sinon-chai")).use(require("chai-as-promised")).expect;

const sampleAllowedEvent = {
	"Event Source": "db-snapshot",
	"Event Time": "2021-11-26 16:11:39.735",
	"Identifier Link": "someLink",
	"Source ID": "rds:db-dev-test-2021-11-26-16-10",
	"Source ARN": "arn:aws:rds:eu-west-1:1231231231231:snapshot:rds:db-dev-test-2021-11-26-16-10",
	"Event ID": "http://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_Events.html#RDS-EVENT-0091",
	"Event Message": "Some unsupported event"
}

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
	const sandbox: SinonSandbox = sinon.createSandbox();
	const journalSpy: SinonSpy = sandbox.spy();

	before(() => {
		// console._setLogger(journalSpy);
		process.env.CONFIG_STAGE = CONFIG_STAGE;
	});

	after(() => {
		delete process.env.CONFIG_STAGE;
		sandbox.restore();
		// journal._resetLogger();
	});

	describe("GIVEN processEvent receives an event", () => {
		describe("WHEN the event message is NOT an allowed event", () => {
			before(async () => {
				// eslint-disable-next-line @typescript-eslint/no-empty-function
				await main(buildSqsEvent(sampleAllowedEvent), {} as Context)
			});
			it("SHOULD log that the message was skipped", () => {
				expect(journalSpy).to.have.been.calledWithMatch(
					{
						level: "Info",
						name: "rds-s3-exporter.skipped.notsupportedtype",
						eventType: "Some unsupported event"
					}
				)
			});
		});
	});
});
