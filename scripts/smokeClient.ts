import { main } from '../tooling/internal/smokeClient_impl';

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
