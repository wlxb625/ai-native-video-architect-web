import '@fastify/jwt';
declare module '@fastify/jwt'{interface FastifyJWT{payload:{sub:string;email:string};user:{sub:string;email:string}}}
declare module 'fastify'{interface FastifyRequest{authUser?:{id:string;email:string}}}
