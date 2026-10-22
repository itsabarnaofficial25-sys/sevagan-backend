import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1766385380005 implements MigrationInterface {
    name = 'InitialSchema1766385380005'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('CUSTOMER', 'TECHNICIAN', 'ADMIN')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phone" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'CUSTOMER', "name" character varying, "email" character varying, "isActive" boolean NOT NULL DEFAULT true, "fcmToken" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "service_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "nameEn" character varying NOT NULL, "nameTa" character varying NOT NULL, "description" character varying, "basePrice" double precision NOT NULL, "minPrice" double precision NOT NULL, "maxPrice" double precision NOT NULL, "commissionPercent" double precision NOT NULL DEFAULT '15', "iconUrl" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7ef2e28b495d09a4eb28997c653" UNIQUE ("name"), CONSTRAINT "PK_fe4da5476c4ffe5aa2d3524ae68" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."technicians_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')`);
        await queryRunner.query(`CREATE TABLE "technicians" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "name" character varying NOT NULL, "skills" text array NOT NULL, "experience" integer NOT NULL, "serviceRadiusKm" double precision NOT NULL DEFAULT '5', "status" "public"."technicians_status_enum" NOT NULL DEFAULT 'PENDING', "rating" double precision NOT NULL DEFAULT '0', "totalRatings" integer NOT NULL DEFAULT '0', "latitude" double precision, "longitude" double precision, "isOnline" boolean NOT NULL DEFAULT false, "aadhaarImageUrl" character varying, "profileImageUrl" character varying, "walletBalance" double precision NOT NULL DEFAULT '0', "completedJobs" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b14514b23605f79475be53065b3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."service_requests_status_enum" AS ENUM('REQUESTED', 'TECHNICIAN_ASSIGNED', 'TECHNICIAN_ON_THE_WAY', 'JOB_STARTED', 'JOB_COMPLETED', 'PAYMENT_PENDING', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "service_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "customer_id" uuid NOT NULL, "technician_id" uuid, "service_category_id" uuid NOT NULL, "status" "public"."service_requests_status_enum" NOT NULL DEFAULT 'REQUESTED', "description" text NOT NULL, "imageUrls" text array NOT NULL DEFAULT '{}', "voiceNoteUrl" character varying, "estimatedPrice" double precision NOT NULL, "finalPrice" double precision, "locationLat" double precision NOT NULL, "locationLng" double precision NOT NULL, "locationAddress" character varying, "customerName" character varying, "customerPhone" character varying, "assignedAt" TIMESTAMP, "startedAt" TIMESTAMP, "completedAt" TIMESTAMP, "cancelledAt" TIMESTAMP, "cancellationReason" character varying, "startJobOtp" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ee60bcd826b7e130bfbd97daf66" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."payments_method_enum" AS ENUM('CASH', 'UPI')`);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "service_request_id" uuid NOT NULL, "amount" double precision NOT NULL, "platformFee" double precision NOT NULL, "commissionAmount" double precision NOT NULL, "technicianAmount" double precision NOT NULL, "method" "public"."payments_method_enum" NOT NULL, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'PENDING', "razorpayOrderId" character varying, "razorpayPaymentId" character varying, "razorpaySignature" character varying, "metadata" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "ratings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "service_request_id" uuid NOT NULL, "customer_id" uuid NOT NULL, "technician_id" uuid NOT NULL, "rating" integer NOT NULL, "comment" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0f31425b073219379545ad68ed9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "otp_codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phone" character varying NOT NULL, "code" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "isUsed" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9d0487965ac1837d57fec4d6a26" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "technicians" ADD CONSTRAINT "FK_d86d7aa49aa7823f841ac49b0ba" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD CONSTRAINT "FK_1f899159d1935fa7ff19f06d733" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD CONSTRAINT "FK_58f2a97d333d8740ce83c675e41" FOREIGN KEY ("technician_id") REFERENCES "technicians"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD CONSTRAINT "FK_cabfb2aa95d6a5793353ad6f61d" FOREIGN KEY ("service_category_id") REFERENCES "service_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_ea105d195b7ecd60a22771b3d59" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ratings" ADD CONSTRAINT "FK_d3e2a77c9cfc2ed35a496b1c3a5" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ratings" ADD CONSTRAINT "FK_5fa7f86e5e2fb9dbf03c276c1f3" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ratings" ADD CONSTRAINT "FK_5ffa3b3117881eb08b855dec54c" FOREIGN KEY ("technician_id") REFERENCES "technicians"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ratings" DROP CONSTRAINT "FK_5ffa3b3117881eb08b855dec54c"`);
        await queryRunner.query(`ALTER TABLE "ratings" DROP CONSTRAINT "FK_5fa7f86e5e2fb9dbf03c276c1f3"`);
        await queryRunner.query(`ALTER TABLE "ratings" DROP CONSTRAINT "FK_d3e2a77c9cfc2ed35a496b1c3a5"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_ea105d195b7ecd60a22771b3d59"`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP CONSTRAINT "FK_cabfb2aa95d6a5793353ad6f61d"`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP CONSTRAINT "FK_58f2a97d333d8740ce83c675e41"`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP CONSTRAINT "FK_1f899159d1935fa7ff19f06d733"`);
        await queryRunner.query(`ALTER TABLE "technicians" DROP CONSTRAINT "FK_d86d7aa49aa7823f841ac49b0ba"`);
        await queryRunner.query(`DROP TABLE "otp_codes"`);
        await queryRunner.query(`DROP TABLE "ratings"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payments_method_enum"`);
        await queryRunner.query(`DROP TABLE "service_requests"`);
        await queryRunner.query(`DROP TYPE "public"."service_requests_status_enum"`);
        await queryRunner.query(`DROP TABLE "technicians"`);
        await queryRunner.query(`DROP TYPE "public"."technicians_status_enum"`);
        await queryRunner.query(`DROP TABLE "service_categories"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
