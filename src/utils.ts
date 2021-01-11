import { model3Object, model3Motion } from './type';

/**
 * 将模型json里所有资源 url 替换为 blob url
 * @name toBlob 
 * @param modelJsonUrl string 模型json路径
 * @return string 模型json的blob url
 */
export async function toBlob(modelJsonUrl: string, /*callback?: () => void*/): Promise<string> {
    const root = modelJsonUrl.split('/').slice(0, -1).join('/');
    const blobFetch = async (input: RequestInfo, name: string): Promise<string> => {
        try {
            const data = await fetch(input);
            return URL.createObjectURL(await data.blob());
        } catch (e) {
            throw `${name} request failed:\n  ${e}`;
        }
    };

    const asyncList: (() => Promise<void>)[] = [];
    const model: model3Object = await fetch(modelJsonUrl)
        .then(async data => await data.json())
        .catch((e) => {
            throw `Model json request failed:\n  ${e}`;
        });



    //Moc
    asyncList.push(async () => {
        const path = model.FileReferences.Moc;
        model.FileReferences.Moc = await blobFetch(`${root}/${path}`, path);
    });

    //Textures
    model.FileReferences.Textures.map((path, index) => {
        asyncList.push(async () => {
            model.FileReferences.Textures[index] = await blobFetch(`${root}/${path}`, path);
        });
    });

    //Physics Pose UserData
    ['Physics', 'Pose', 'UserData'].map((key) => {
        if (model.FileReferences[key] !== undefined) {
            asyncList.push(async () => {
                const path = model.FileReferences[key];
                model.FileReferences[key] = await blobFetch(`${root}/${path}`, path);
            });
        }
    });

    //Motions
    if (Object.keys(model.FileReferences.Motions).length > 0) {
        Object.entries(model.FileReferences.Motions).map(data => {
            const key = data[0];
            const motions: model3Motion[] = data[1];

            motions.map((motion, index) => {
                asyncList.push(async () => {
                    const path = motion.File;
                    model.FileReferences.Motions[key][index].File = await blobFetch(`${root}/${path}`, path);
                });
            });
        });
    }

    //Expressions
    if (model.FileReferences.Expressions !== undefined && model.FileReferences.Expressions.length > 0) {
        model.FileReferences.Expressions.map((exp, index) => {
            asyncList.push(async () => {
                const path = exp.File;
                model.FileReferences.Expressions[index].File = await blobFetch(`${root}/${path}`, path);
            });
        });
    }

    await Promise.all(asyncList.map(fn => fn()));
    return URL.createObjectURL(new Blob([JSON.stringify(model)]));
}