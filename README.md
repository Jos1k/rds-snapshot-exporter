<div align="center">

![](./docs/db-export.png)

# RDS Snapshot S3 Exporter

</div>

Exports postal-returns DB snapshots to an S3 bucket with an object lock in compliance mode for 2 days. Objects in that S3 bucket have retention period of 1 days (COMPLIANCE mode), which restricts files to be deleted by any user (even root user) before end of retention period.

## Architecture

![](./docs/architecture.png)

[PlantUml source](./docs/architecture.puml)

## Example of event

```json
{
    "Event Source": "db-snapshot",
    "Event Time": "2021-12-01 15:53:42.823",
    "Identifier Link": "https://console.aws.amazon.com/rds/home?region=eu-west-1#snapshot:id=test-snapshottttt",
    "Source ID": "test-snapshottttt",
    "Source ARN": "arn:aws:rds:eu-west-1:123123123123:snapshot:test-snapshottttt",
    "Event ID": "http://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_Events.html#RDS-EVENT-0042",
    "Event Message": "Manual snapshot created"
}
```

## Accepted Snapshots Prefixes (Source ID):

- rds:db-${env}-test

## Accepted Snapshots Event Types (Event Message):

- "Manual snapshot created"
- "Automated snapshot created"
