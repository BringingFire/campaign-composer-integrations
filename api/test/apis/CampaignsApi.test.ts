import {
  CampaignsApi,
  Configuration,
  DocumentsApi,
  EntitiesApi,
  FoldersApi,
  ImagesApi,
  LinksApi,
  MapsApi,
} from '../../dist/typescript/dist';
import {
  TEST_CAMPAIGNS_EXPECT_LENGTH,
  TEST_CAMPAIGN_ID,
  TEST_DOCUMENTS_EXPECT_LENGTH,
  TEST_DOCUMENT_ID,
  TEST_ENTITIES_EXPECT_LENGTH,
  TEST_ENTITIES_WITH_FOLDER_EXPECT_LENGTH,
  TEST_ENTITY_ID,
  TEST_FOLDERS_EXPECT_LENGTH,
  TEST_FOLDER_ID,
  TEST_IMAGES_EXPECT_LENGTH,
  TEST_IMAGE_ID,
  TEST_LINKS_EXPECT_LENGTH,
  TEST_LINK_ID,
  TEST_LINK_URL,
  TEST_MAPS_EXPECT_LENGTH,
  TEST_MAP_EXPECT_WIDTH,
  TEST_MAP_ID,
} from './data';

const config = new Configuration({
  basePath: process.env.CC_TEST_BASE,
  apiKey: process.env.CC_TEST_KEY,
});

describe('campaigns', () => {
  const api = new CampaignsApi(config);

  test('list', async () => {
    const res = await api.listCampaigns();
    expect(res.length).toBe(TEST_CAMPAIGNS_EXPECT_LENGTH);
    const campaign = res[0];
    expect(campaign.id).toBe(TEST_CAMPAIGN_ID);
  });
});

describe('documents', () => {
  const api = new DocumentsApi(config);

  test('list', async () => {
    const res = await api.listDocuments({ campaignId: TEST_CAMPAIGN_ID });
    expect(res.length).toBe(TEST_DOCUMENTS_EXPECT_LENGTH);
    const doc = res[0];
    expect(doc.id).toBe(TEST_DOCUMENT_ID);
  });

  test('get', async () => {
    const res = await api.getDocument({
      campaignId: TEST_CAMPAIGN_ID,
      docId: TEST_DOCUMENT_ID,
    });
    expect(res.id).toBe(TEST_DOCUMENT_ID);
  });
});

describe('maps', () => {
  const api = new MapsApi(config);

  test('list', async () => {
    const res = await api.listMaps({ campaignId: TEST_CAMPAIGN_ID });
    expect(res.length).toBe(TEST_MAPS_EXPECT_LENGTH);
    const map = res[0];
    expect(map.id).toBe(TEST_MAP_ID);
  });

  test('get', async () => {
    const res = await api.getMap({
      campaignId: TEST_CAMPAIGN_ID,
      mapId: TEST_MAP_ID,
    });
    expect(res.id).toBe(TEST_MAP_ID);
  });

  test('get map background', async () => {
    const res = await api.getMapBackground({
      campaignId: TEST_CAMPAIGN_ID,
      mapId: TEST_MAP_ID,
    });
    expect(res.width).toBe(TEST_MAP_EXPECT_WIDTH);
  });
});

describe('folders', () => {
  const api = new FoldersApi(config);

  test('list', async () => {
    const res = await api.listFolders({ campaignId: TEST_CAMPAIGN_ID });
    expect(res.length).toBe(TEST_FOLDERS_EXPECT_LENGTH);
    const folder = res[0];
    expect(folder.id).toBe(TEST_FOLDER_ID);
  });

  test('get', async () => {
    const res = await api.getFolder({
      campaignId: TEST_CAMPAIGN_ID,
      folderId: TEST_FOLDER_ID,
    });
    expect(res.id).toBe(TEST_FOLDER_ID);
  });
});

describe('links', () => {
  const api = new LinksApi(config);

  test('list', async () => {
    const res = await api.listLinks({ campaignId: TEST_CAMPAIGN_ID });
    expect(res.length).toBe(TEST_LINKS_EXPECT_LENGTH);
    const link = res[0];
    expect(link.id).toBe(TEST_LINK_ID);
  });

  test('get', async () => {
    const res = await api.getLink({
      campaignId: TEST_CAMPAIGN_ID,
      linkId: TEST_LINK_ID,
    });
    expect(res.id).toBe(TEST_LINK_ID);
    expect(res.url).toBe(TEST_LINK_URL);
  });
});

describe('images', () => {
  const api = new ImagesApi(config);

  test('list', async () => {
    const res = await api.listImages({ campaignId: TEST_CAMPAIGN_ID });
    expect(res.length).toBe(TEST_IMAGES_EXPECT_LENGTH);
    const image = res[0];
    expect(image.id).toBe(TEST_IMAGE_ID);
  });

  test('get', async () => {
    const res = await api.getImage({
      campaignId: TEST_CAMPAIGN_ID,
      imageId: TEST_IMAGE_ID,
    });
    expect(res.id).toBe(TEST_IMAGE_ID);
  });
});

describe('entities', () => {
  const api = new EntitiesApi(config);

  describe('list', () => {
    test('without parameters', async () => {
      const res = await api.listEntities({ campaignId: TEST_CAMPAIGN_ID });
      expect(res.length).toBe(TEST_ENTITIES_EXPECT_LENGTH);
    });

    test('with parameters', async () => {
      const res = await api.listEntities({
        campaignId: TEST_CAMPAIGN_ID,
        folderId: TEST_FOLDER_ID,
      });
      expect(res.length).toBe(TEST_ENTITIES_WITH_FOLDER_EXPECT_LENGTH);
    });
  });

  test('get entity', async () => {
    const res = await api.getEntity({
      campaignId: TEST_CAMPAIGN_ID,
      entityId: TEST_ENTITY_ID,
    });
    expect(res.id).toBe(TEST_ENTITY_ID);
  });
});
