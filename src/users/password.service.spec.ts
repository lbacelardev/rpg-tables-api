import { PasswordService } from './password.service.js';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('gera um hash que permite verificar a senha original', async () => {
    const password = 'senha-de-exemplo';

    const hash = await service.hash(password);

    expect(hash).not.toBe(password);
    await expect(service.verify(hash, password)).resolves.toBe(true);
  });

  it('gera um hash que faz a verificação com outra senha', async () => {
    const password = 'senha-de-exemplo';
    const diferentPassword = 'senha-diferente'

    const hash = await service.hash(password);

    expect(hash).not.toBe(password);
    await expect(service.verify(hash, diferentPassword)).resolves.toBe(false);
  });

  it('gera dois hashes diferentes com a mesma senha e as duas verificações devem passar', async () => {
    const password = 'senha-de-exemplo';

    const hash = await service.hash(password);
    const hash2 = await service.hash(password);

    expect(hash).not.toBe(password);
    expect(hash2).not.toBe(password);
    expect(hash).not.toBe(hash2);
    await expect(service.verify(hash, password)).resolves.toBe(true);
    await expect(service.verify(hash2, password)).resolves.toBe(true);
  });
});
