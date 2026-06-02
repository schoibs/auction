import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuctions1780421345075 implements MigrationInterface {
    name = 'CreateAuctions1780421345075'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."auction_status" AS ENUM('ACTIVE', 'CLOSING', 'CLOSED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "auctions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "card_id" uuid NOT NULL, "seller_user_id" uuid NOT NULL, "status" "public"."auction_status" NOT NULL DEFAULT 'ACTIVE', "start_price" integer NOT NULL, "current_highest_bid_id" uuid, "start_time" TIMESTAMP WITH TIME ZONE NOT NULL, "end_time" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "closed_at" TIMESTAMP WITH TIME ZONE, "cancelled_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "CHK_5e044312774027ac79d052d7c0" CHECK ("end_time" > "start_time"), CONSTRAINT "CHK_bf5ea57d6100249f8b2e0b4aef" CHECK ("start_price" >= 0), CONSTRAINT "PK_87d2b34d4829f0519a5c5570368" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "auctions" ADD CONSTRAINT "FK_33432201c6864242fa980ab4a35" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auctions" ADD CONSTRAINT "FK_8df6332cceb57faea0962c6fadb" FOREIGN KEY ("seller_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "auctions" DROP CONSTRAINT "FK_8df6332cceb57faea0962c6fadb"`);
        await queryRunner.query(`ALTER TABLE "auctions" DROP CONSTRAINT "FK_33432201c6864242fa980ab4a35"`);
        await queryRunner.query(`DROP TABLE "auctions"`);
        await queryRunner.query(`DROP TYPE "public"."auction_status"`);
    }

}
