import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommissionTypeFields1704537600000 implements MigrationInterface {
    name = 'AddCommissionTypeFields1704537600000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add commission_type column with default value
        await queryRunner.query(`
            ALTER TABLE "service_categories" 
            ADD "commission_type" character varying(20) NOT NULL DEFAULT 'PERCENTAGE'
        `);

        // Add commission_amount column (nullable)
        await queryRunner.query(`
            ALTER TABLE "service_categories" 
            ADD "commission_amount" double precision
        `);

        // Update existing records to have PERCENTAGE type
        await queryRunner.query(`
            UPDATE "service_categories" 
            SET "commission_type" = 'PERCENTAGE' 
            WHERE "commission_type" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove commission_amount column
        await queryRunner.query(`
            ALTER TABLE "service_categories" 
            DROP COLUMN "commission_amount"
        `);

        // Remove commission_type column
        await queryRunner.query(`
            ALTER TABLE "service_categories" 
            DROP COLUMN "commission_type"
        `);
    }
}
