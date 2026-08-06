import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { SignInDto, LoginResponseDto, ErrorResponseDto, ProfileResponseDto } from './user.schema.js';
import { withAuth } from '../../shared/schema.js';

export function registerUserRoutes(app: FastifyInstance) {

    const route = app.withTypeProvider<ZodTypeProvider>();

    route.post('/login', {
        schema: {
            tags: ['User'],
            body: SignInDto,
            response: {
                200: LoginResponseDto,
                401: ErrorResponseDto,
            },
        },
    }, async (request, reply) => {
        const { email, password } = request.body;
        const userRepository = request.di.resolve('userRepository');
        const user = await userRepository.findOne({ email });

        if (!user || !(await user.verifyPassword(password))) {
            return reply.status(401).send({ error: 'Invalid credentials' });
        }

        const token = app.jwt.sign({ id: user.id }, { expiresIn: '7d' });
        return { token };
    });

    route.get('/profile', {
        schema: {
            tags: ['User'],
            ...withAuth(),
            response: {
                200: ProfileResponseDto,
            },
        },
    }, (request) => {
        const user = request.user
        console.log(user)
        return { id: user.id, email: user.email };
    });
}
