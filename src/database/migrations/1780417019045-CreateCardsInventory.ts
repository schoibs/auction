import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCardsInventory1780417019045 implements MigrationInterface {
  name = 'CreateCardsInventory1780417019045';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "card_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "attack" integer NOT NULL, "midfield" integer NOT NULL, "defense" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_73c51f89ba58deb8465630035e" CHECK ("defense" >= 1 AND "defense" <= 99), CONSTRAINT "CHK_33133b3136a6fb478e8386408c" CHECK ("midfield" >= 1 AND "midfield" <= 99), CONSTRAINT "CHK_652379e370f0e98eefa07fbad2" CHECK ("attack" >= 1 AND "attack" <= 99), CONSTRAINT "PK_2e832349781fa27274c3dbdeb30" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."card_status" AS ENUM('OWNED', 'LOCKED_IN_AUCTION')`,
    );
    await queryRunner.query(
      `CREATE TABLE "cards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "card_type_id" uuid NOT NULL, "owner_user_id" uuid NOT NULL, "status" "public"."card_status" NOT NULL DEFAULT 'OWNED', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_5f3269634705fdff4a9935860fc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "cards" ADD CONSTRAINT "FK_010040e63b2b829e93035964636" FOREIGN KEY ("card_type_id") REFERENCES "card_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cards" ADD CONSTRAINT "FK_019d61c2fe46dd903638ed3bfe9" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cards" DROP CONSTRAINT "FK_019d61c2fe46dd903638ed3bfe9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cards" DROP CONSTRAINT "FK_010040e63b2b829e93035964636"`,
    );
    await queryRunner.query(`DROP TABLE "cards"`);
    await queryRunner.query(`DROP TYPE "public"."card_status"`);
    await queryRunner.query(`DROP TABLE "card_types"`);
  }
}
