import * as api from '../dist/typescript/dist';
import * as fixtures from './fixtures';

const config = new api.Configuration({
  basePath: process.env.CC_TEST_BASE ?? 'http://localhost:4492',
  apiKey: process.env.CC_TEST_KEY ?? 'password123',
});

describe('campaigns', () => {
  const client = new api.CampaignsApi(config);

  test('list', async () => {
    const res = await client.listCampaigns();
    expect(res.length).toBe(fixtures.TEST_CAMPAIGNS_EXPECT_LENGTH);
    const campaign = res[0];
    expect(campaign.id).toBe(fixtures.TEST_CAMPAIGN_ID);
  });
});

describe('documents', () => {
  const client = new api.DocumentsApi(config);

  test('list', async () => {
    const res = await client.listDocuments({
      campaignId: fixtures.TEST_CAMPAIGN_ID,
    });
    expect(res.length).toBe(fixtures.TEST_DOCUMENTS_EXPECT_LENGTH);
    const doc = res[0];
    expect(doc.id).toBe(fixtures.TEST_DOCUMENT_ID);
  });

  test('get', async () => {
    const res = await client.getDocument({
      campaignId: fixtures.TEST_CAMPAIGN_ID,
      docId: fixtures.TEST_DOCUMENT_ID,
    });
    expect(res.id).toBe(fixtures.TEST_DOCUMENT_ID);
  });
});

describe('maps', () => {
  const client = new api.MapsApi(config);

  test('list', async () => {
    const res = await client.listMaps({
      campaignId: fixtures.TEST_CAMPAIGN_ID,
    });
    expect(res.length).toBe(fixtures.TEST_MAPS_EXPECT_LENGTH);
    const map = res[0];
    expect(map.id).toBe(fixtures.TEST_MAP_ID);
  });

  test('get', async () => {
    const res = await client.getMap({
      campaignId: fixtures.TEST_CAMPAIGN_ID,
      mapId: fixtures.TEST_MAP_ID,
    });
    expect(res.id).toBe(fixtures.TEST_MAP_ID);
  });

  test('get map background', async () => {
    const res = await client.getMapBackground({
      campaignId: fixtures.TEST_CAMPAIGN_ID,
      mapId: fixtures.TEST_MAP_ID,
    });
    expect(res.width).toBe(fixtures.TEST_MAP_EXPECT_WIDTH);
  });
});

describe('folders', () => {
  const client = new api.FoldersApi(config);

  test('list', async () => {
    const res = await client.listFolders({
      campaignId: fixtures.TEST_CAMPAIGN_ID,
    });
    expect(res.length).toBe(fixtures.TEST_FOLDERS_EXPECT_LENGTH);
    const folder = res[0];
    expect(folder.id).toBe(fixtures.TEST_FOLDER_ID);
  });

  test('get', async () => {
    const res = await client.getFolder({
      campaignId: fixtures.TEST_CAMPAIGN_ID,
      folderId: fixtures.TEST_FOLDER_ID,
    });
    expect(res.id).toBe(fixtures.TEST_FOLDER_ID);
  });
});

describe('links', () => {
  const client = new api.LinksApi(config);

  test('list', async () => {
    const res = await client.listLinks({
      campaignId: fixtures.TEST_CAMPAIGN_ID,
    });
    expect(res.length).toBe(fixtures.TEST_LINKS_EXPECT_LENGTH);
    const link = res[0];
    expect(link.id).toBe(fixtures.TEST_LINK_ID);
  });

  test('get', async () => {
    const res = await client.getLink({
      campaignId: fixtures.TEST_CAMPAIGN_ID,
      linkId: fixtures.TEST_LINK_ID,
    });
    expect(res.id).toBe(fixtures.TEST_LINK_ID);
    expect(res.url).toBe(fixtures.TEST_LINK_URL);
  });
});

describe('images', () => {
  const client = new api.ImagesApi(config);

  test('list', async () => {
    const res = await client.listImages({
      campaignId: fixtures.TEST_CAMPAIGN_ID,
    });
    expect(res.length).toBe(fixtures.TEST_IMAGES_EXPECT_LENGTH);
    const image = res[0];
    expect(image.id).toBe(fixtures.TEST_IMAGE_ID);
  });

  test('get', async () => {
    const res = await client.getImage({
      campaignId: fixtures.TEST_CAMPAIGN_ID,
      imageId: fixtures.TEST_IMAGE_ID,
    });
    expect(res.id).toBe(fixtures.TEST_IMAGE_ID);
  });
});

describe('entities', () => {
  const client = new api.EntitiesApi(config);

  describe('list', () => {
    test('without parameters', async () => {
      const res = await client.listEntities({
        campaignId: fixtures.TEST_CAMPAIGN_ID,
      });
      expect(res.length).toBe(fixtures.TEST_ENTITIES_EXPECT_LENGTH);
    });

    test('with parameters', async () => {
      const res = await client.listEntities({
        campaignId: fixtures.TEST_CAMPAIGN_ID,
        folderId: fixtures.TEST_FOLDER_ID,
      });
      expect(res.length).toBe(fixtures.TEST_ENTITIES_WITH_FOLDER_EXPECT_LENGTH);
    });
  });

  test('get entity', async () => {
    const res = await client.getEntity({
      campaignId: fixtures.TEST_CAMPAIGN_ID,
      entityId: fixtures.TEST_ENTITY_ID,
    });
    expect(res.id).toBe(fixtures.TEST_ENTITY_ID);
  });
});
