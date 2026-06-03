import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCardTransfers1780457159799 implements MigrationInterface {
    name = 'CreateCardTransfers1780457159799'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "card_transfers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "card_id" uuid NOT NULL, "from_user_id" uuid NOT NULL, "to_user_id" uuid NOT NULL, "auction_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c6e3fbcf5f965d7480deb7c0dc8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_card_transfers_auction_id" ON "card_transfers"  ("auction_id") `);
        await queryRunner.query(`CREATE INDEX "idx_card_transfers_to_user_id" ON "card_transfers"  ("to_user_id") `);
        await queryRunner.query(`CREATE INDEX "idx_card_transfers_from_user_id" ON "card_transfers"  ("from_user_id") `);
        await queryRunner.query(`CREATE INDEX "idx_card_transfers_card_id" ON "card_transfers"  ("card_id") `);
        await queryRunner.query(`ALTER TABLE "card_transfers" ADD CONSTRAINT "FK_e9160c33b0129f080b56f141bbe" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "card_transfers" ADD CONSTRAINT "FK_771be03310213572afee08f0ec4" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "card_transfers" ADD CONSTRAINT "FK_183e233841e4ce906bf393e63a2" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "card_transfers" ADD CONSTRAINT "FK_e4cb153d211a755cc5a54f983b5" FOREIGN KEY ("auction_id") REFERENCES "auctions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "card_transfers" DROP CONSTRAINT "FK_e4cb153d211a755cc5a54f983b5"`);
        await queryRunner.query(`ALTER TABLE "card_transfers" DROP CONSTRAINT "FK_183e233841e4ce906bf393e63a2"`);
        await queryRunner.query(`ALTER TABLE "card_transfers" DROP CONSTRAINT "FK_771be03310213572afee08f0ec4"`);
        await queryRunner.query(`ALTER TABLE "card_transfers" DROP CONSTRAINT "FK_e9160c33b0129f080b56f141bbe"`);
        await queryRunner.query(`DROP INDEX "public"."idx_card_transfers_card_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_card_transfers_from_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_card_transfers_to_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_card_transfers_auction_id"`);
        await queryRunner.query(`DROP TABLE "card_transfers"`);
    }

}
