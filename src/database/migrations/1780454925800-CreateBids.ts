import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBids1780454925800 implements MigrationInterface {
    name = 'CreateBids1780454925800'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "bids" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "auction_id" uuid NOT NULL, "bidder_user_id" uuid NOT NULL, "amount" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_3a4bc1a559cb8745a6f45015d2" CHECK ("amount" > 0), CONSTRAINT "PK_7950d066d322aab3a488ac39fe5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_bids_bidder_user_id" ON "bids"  ("bidder_user_id") `);
        await queryRunner.query(`CREATE INDEX "idx_bids_auction_amount" ON "bids"  ("auction_id", "amount") `);
        await queryRunner.query(`ALTER TABLE "bids" ADD CONSTRAINT "FK_7d24f04e55838b694acc9d35bfe" FOREIGN KEY ("auction_id") REFERENCES "auctions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bids" ADD CONSTRAINT "FK_288ffe5fa47d937ebc867e6f998" FOREIGN KEY ("bidder_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auctions" ADD CONSTRAINT "FK_8ede68b6281a202154c20a7cddd" FOREIGN KEY ("current_highest_bid_id") REFERENCES "bids"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "auctions" DROP CONSTRAINT "FK_8ede68b6281a202154c20a7cddd"`);
        await queryRunner.query(`ALTER TABLE "bids" DROP CONSTRAINT "FK_288ffe5fa47d937ebc867e6f998"`);
        await queryRunner.query(`ALTER TABLE "bids" DROP CONSTRAINT "FK_7d24f04e55838b694acc9d35bfe"`);
        await queryRunner.query(`DROP INDEX "public"."idx_bids_auction_amount"`);
        await queryRunner.query(`DROP INDEX "public"."idx_bids_bidder_user_id"`);
        await queryRunner.query(`DROP TABLE "bids"`);
    }

}
