import { captureServiceIntroScreens } from './service-intro/capture';
import { getManifestPath } from './service-intro/config';
import { buildServiceIntroDeck } from './service-intro/ppt';

async function main() {
  const manifest = await captureServiceIntroScreens();
  const pptPath = await buildServiceIntroDeck(manifest);
  console.log(
    JSON.stringify(
      {
        baseUrl: manifest.baseUrl,
        captureCount: manifest.items.length,
        manifestPath: getManifestPath(),
        pptPath,
      },
      null,
      2,
    ),
  );
}

void main();
