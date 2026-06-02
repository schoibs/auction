import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import dataSource from '../src/database/data-source';
import { CardType } from '../src/card-types/card-type.entity';
import { Card, CardStatus } from '../src/cards/card.entity';
import { User } from '../src/users/user.entity';

async function main() {
  await dataSource.initialize();

  const usersRepository = dataSource.getRepository(User);
  const cardTypesRepository = dataSource.getRepository(CardType);
  const cardsRepository = dataSource.getRepository(Card);

  const user1 = await findOrCreateUser(usersRepository, {
    email: 'user1@example.com',
    username: 'user1',
    password: 'password123',
  });

  const user2 = await findOrCreateUser(usersRepository, {
    email: 'user2@example.com',
    username: 'user2',
    password: 'password123',
  });

  const lionelMessi = await findOrCreateCardType(cardTypesRepository, {
    name: 'Lionel Messi',
    attack: 82,
    midfield: 64,
    defense: 71,
  });

  const cristianoRonaldo = await findOrCreateCardType(cardTypesRepository, {
    name: 'Cristiano Ronaldo',
    attack: 67,
    midfield: 76,
    defense: 48,
  });

  const neymar = await findOrCreateCardType(cardTypesRepository, {
    name: 'Neymar',
    attack: 95,
    midfield: 58,
    defense: 88,
  });

  await mintIfMissing(cardsRepository, user1, lionelMessi);
  await mintIfMissing(cardsRepository, user1, cristianoRonaldo);
  await mintIfMissing(cardsRepository, user2, neymar);

  console.log('Seed complete');
  await dataSource.destroy();
}

interface SeedUserInput {
  email: string;
  username: string;
  password: string;
}

async function findOrCreateUser(
  usersRepository: Repository<User>,
  input: SeedUserInput,
): Promise<User> {
  const existingUser = await usersRepository.findOne({
    where: { email: input.email },
  });

  if (existingUser) {
    return existingUser;
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  return usersRepository.save(
    usersRepository.create({
      email: input.email,
      username: input.username,
      passwordHash,
    }),
  );
}

interface SeedCardTypeInput {
  name: string;
  attack: number;
  midfield: number;
  defense: number;
}

async function findOrCreateCardType(
  cardTypesRepository: Repository<CardType>,
  input: SeedCardTypeInput,
): Promise<CardType> {
  const existingCardType = await cardTypesRepository.findOne({
    where: { name: input.name },
  });

  if (existingCardType) {
    return existingCardType;
  }

  return cardTypesRepository.save(cardTypesRepository.create(input));
}

async function mintIfMissing(
  cardsRepository: Repository<Card>,
  owner: User,
  cardType: CardType,
): Promise<Card> {
  const existingCard = await cardsRepository.findOne({
    where: {
      ownerUserId: owner.id,
      cardTypeId: cardType.id,
    },
  });

  if (existingCard) {
    return existingCard;
  }

  return cardsRepository.save(
    cardsRepository.create({
      ownerUserId: owner.id,
      owner,
      cardTypeId: cardType.id,
      cardType,
      status: CardStatus.OWNED,
    }),
  );
}

main().catch(async (error) => {
  console.error(error);

  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }

  process.exit(1);
});
