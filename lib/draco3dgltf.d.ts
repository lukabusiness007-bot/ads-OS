declare module "draco3dgltf" {
  type DracoFactory = () => Promise<unknown>;

  const draco3d: {
    createDecoderModule: DracoFactory;
    createEncoderModule: DracoFactory;
  };

  export const createDecoderModule: DracoFactory;
  export const createEncoderModule: DracoFactory;
  export default draco3d;
}
