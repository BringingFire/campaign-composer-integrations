import {
    listCampaigns,
    listDocuments,
    getDocument,
    listMaps,
    getMap,
    getMapBackground,
    getMapMetadata,
    getMapPins,
    listFolders,
    getFolder,
    listImages,
    getImage,
    listEntities,
    getEntity,
} from './index.ts';
import {
    TEST_CAMPAIGN_ID,
    TEST_DOCUMENT_ID,
    TEST_MAP_ID,
    TEST_FOLDER_ID,
    TEST_IMAGE_ID,
    TEST_ENTITY_ID,
} from './data.ts';

const successStatus = 200;

test('list campaigns', async () => {
    const res = await listCampaigns();
    expect(res.status).toBe(successStatus);
});

test('list documents', async () => {
    const res = await listDocuments({ campaignId: TEST_CAMPAIGN_ID });
    expect(res.status).toBe(successStatus);
});

test('get document', async () => {
    const res = await getDocument({ campaignId: TEST_CAMPAIGN_ID, componentId: TEST_DOCUMENT_ID });
    expect(res.status).toBe(successStatus);
});

test('list maps', async () => {
    const res = await listMaps({ campaignId: TEST_CAMPAIGN_ID });
    expect(res.status).toBe(successStatus);
});

test('get map', async () => {
    const res = await getMap({ campaignId: TEST_CAMPAIGN_ID, componentId: TEST_MAP_ID });
    expect(res.status).toBe(successStatus);
});

test('get map background', async () => {
    const res = await getMapBackground({ campaignId: TEST_CAMPAIGN_ID, componentId: TEST_MAP_ID });
    expect(res.status).toBe(successStatus);
});

test('get map metadata', async () => {
    const res = await getMapMetadata({ campaignId: TEST_CAMPAIGN_ID, componentId: TEST_MAP_ID });
    expect(res.status).toBe(successStatus);
});

test('list map pins', async () => {
    const res = await getMapPins({ campaignId: TEST_CAMPAIGN_ID, componentId: TEST_MAP_ID });
    expect(res.status).toBe(successStatus);
});

test('list folders', async () => {
    const res = await listFolders({ campaignId: TEST_CAMPAIGN_ID });
    expect(res.status).toBe(successStatus);
});

test('get folder', async () => {
    const res = await getFolder({ campaignId: TEST_CAMPAIGN_ID, componentId: TEST_FOLDER_ID });
    expect(res.status).toBe(successStatus);
});

test('list images', async () => {
    const res = await listImages({ campaignId: TEST_CAMPAIGN_ID });
    expect(res.status).toBe(successStatus);
});

test('get image', async () => {
    const res = await getImage({ campaignId: TEST_CAMPAIGN_ID, componentId: TEST_IMAGE_ID });
    expect(res.status).toBe(successStatus);
});

describe('list entities', () => {
    test('without parameters', async () => {
        const res = await listEntities({
            campaignId: TEST_CAMPAIGN_ID,
        });
        expect(res.status).toBe(successStatus);
    });

    test('with parameters', async () => {
        const res = await listEntities({
            campaignId: TEST_CAMPAIGN_ID,
            query: {
                folderId: TEST_FOLDER_ID,
            },
        });
        expect(res.status).toBe(successStatus);
    });
});

test('get entity', async () => {
    const res = await getEntity({ campaignId: TEST_CAMPAIGN_ID, componentId: TEST_ENTITY_ID });
    expect(res.status).toBe(successStatus);
});
