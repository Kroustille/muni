import { InMemoryItemRepository } from "../helpers/in-memory-item-repository";
import { runItemRepositoryContract } from "../helpers/item-repository.contract";

runItemRepositoryContract("InMemoryItemRepository", () => new InMemoryItemRepository());
