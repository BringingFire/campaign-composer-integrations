const host = 'http://localhost:4492';
const apiKey = 'tDeQrn9K0IilKsoiXKM8wqBi';

type Query = Record<string, any>;

interface GetCampaignProps {
    campaignId: number;
    query?: Query;
}

interface GetComponentProps<T extends string | number> extends GetCampaignProps {
    componentId: T;
}

async function testGetEndpoint(path: string, query?: Query): Promise<Response> {
    const queryString = query ? `?${new URLSearchParams(query)}` : '';
    const res = await fetch(`${host}/${path}${queryString}`, {
        headers: {
            'x-api-key': apiKey,
        },
    });
    return res;
}

const listCampaigns: () => Promise<Response> = async (): Promise<Response> => await testGetEndpoint('campaigns');

const listDocuments: (props: GetCampaignProps) => Promise<Response> = async (props: GetCampaignProps): Promise<Response> => await testGetEndpoint(`campaigns/${props.campaignId}/documents`, props.query);

const getDocument: (props: GetComponentProps<string>) => Promise<Response> = async (props: GetComponentProps<string>): Promise<Response> => await testGetEndpoint(`campaigns/${props.campaignId}/documents/${props.componentId}`, props.query);

const listMaps: (props: GetCampaignProps) => Promise<Response> = async (props: GetCampaignProps): Promise<Response> => await testGetEndpoint(`campaigns/${props.campaignId}/maps`, props.query);

const getMap: (props: GetComponentProps<string>) => Promise<Response> = async (props: GetComponentProps<string>): Promise<Response> => await testGetEndpoint(`campaigns/${props.campaignId}/maps/${props.componentId}`, props.query);

const getMapBackground: (props: GetComponentProps<string>) => Promise<Response> = async (props: GetComponentProps<string>): Promise<Response> => await testGetEndpoint(`campaigns/${props.campaignId}/maps/${props.componentId}/background`, props.query);

const getMapMetadata: (props: GetComponentProps<string>) => Promise<Response> = async (props: GetComponentProps<string>): Promise<Response> => await testGetEndpoint(`campaigns/${props.campaignId}/maps/${props.componentId}/metadata`, props.query);

const getMapPins: (props: GetComponentProps<string>) => Promise<Response> = async (props: GetComponentProps<string>): Promise<Response> => await testGetEndpoint(`campaigns/${props.campaignId}/maps/${props.componentId}/pins`, props.query);

const listFolders: (props: GetCampaignProps) => Promise<Response> = async (props: GetCampaignProps): Promise<Response> => await testGetEndpoint(`campaigns/${props.campaignId}/folders`, props.query);

const getFolder: (props: GetComponentProps<number>) => Promise<Response> = async (props: GetComponentProps<number>): Promise<Response> => await testGetEndpoint(`campaigns/${props.campaignId}/folders/${props.componentId}`, props.query);

const listImages: (props: GetCampaignProps) => Promise<Response> = async (props: GetCampaignProps): Promise<Response> => await testGetEndpoint(`campaigns/${props.campaignId}/images`, props.query);

const getImage: (props: GetComponentProps<string>) => Promise<Response> = async (props: GetComponentProps<string>): Promise<Response> => await testGetEndpoint(`campaigns/${props.campaignId}/images/${props.componentId}`, props.query);

const listEntities: (props: GetCampaignProps) => Promise<Response> = async (props: GetCampaignProps): Promise<Response> => await testGetEndpoint(`campaigns/${props.campaignId}/entities`, props.query);

const getEntity: (props: GetComponentProps<number>) => Promise<Response> = async (props: GetComponentProps<number>): Promise<Response> => await testGetEndpoint(`campaigns/${props.campaignId}/entities/${props.componentId}`, props.query);

export {
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
};
