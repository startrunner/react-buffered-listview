export default class Util {
    public static deepClone<T>(item: T): T {
        const result: any = JSON.parse(JSON.stringify(item));
        return result;
    }
}