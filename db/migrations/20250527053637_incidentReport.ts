import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('incident_reports', (table) => {
    // Primary & foreign keys
    table.string('id').primary();
    table
      .integer('groupHomeId')
      .notNullable()
      .references('id')
      .inTable('group_homes')
      .onDelete('CASCADE');
    table
      .integer('residentId')
      .notNullable()
      .references('id')
      .inTable('residents')
      .onDelete('CASCADE');
    table
      .integer('staffId')
      .notNullable()
      .references('staffId')
      .inTable('staff')
      .onDelete('CASCADE');

    // Core incident details
    table.dateTime('incidentDateTime').notNullable();
    table.string('incidentType').notNullable();
    table.string('severityLevel').notNullable();
    table.string('workflowStatus').notNullable();

    // Narrative descriptions
    table.text('description').notNullable();
    table.text('preIncidentContext');
    table.text('postIncidentContext');
    table.text('nearMissDescription');
    table.text('immediateActions');

    // Follow‑up and workflow
    table.boolean('followUpRequired').notNullable().defaultTo(false);
    table.date('followUpDueDate');
    table.dateTime('followUpCompletedAt');

    // Supervisor review
    table.dateTime('supervisorReviewedAt');
    table.text('supervisorNotes');
    table.text('correctiveActions');

    // Fall‑specific fields
    table.string('fallLocation');
    table.boolean('fallWitnessed');
    table.boolean('previousFall');
    table.boolean('injuriesSustained');
    table.text('injuriesDescription');
    table.boolean('firstAidProvided');
    table.text('firstAidDetails');
    table.boolean('emergencyServicesContacted');
    table.boolean('mobilityAidsInUse');
    table.boolean('properFootwear');
    table.text('fallContributingFactors');

    // Medication incident
    table.dateTime('medicationScheduledDateTime');
    table.string('medicationIncidentType');
    table.text('medicationIncidentDescription');
    table.boolean('clientReceivedMedication');
    table.string('pharmacistName');
    table.time('pharmacistConversationTime');
    table.text('pharmacistInstructions');

    // Notifications
    table.boolean('emergencyServicesNotified');
    table.boolean('familyGuardianNotified');
    table.boolean('siteSupervisorNotified');
    table.boolean('onCallSupervisorNotified');
    table.boolean('crisisTeamNotified');
    table.boolean('emergencyContactNotified');
    table.string('notificationName');
    table.time('notificationTime');
    table.text('notificationNotes');

    // Emergency‑service details
    table.string('emergencyServiceType');
    table.string('emergencyServiceResponderName');
    table.string('emergencyServiceBadgeNumber');
    table.string('emergencyServiceFileNumber');

    // Witnesses (JSON array)
    table.json('witnessesJson');

    // Staff completion
    table.string('staffName');
    table.string('staffPosition');
    table.date('reportDate');

    // Timestamps
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('incident_reports');
}
