import { Environments } from '../env';
import { ManagersName, SessionManager, ManagersMapping } from './session';

let managersManager: SessionManager | null = null;

export const GetManager = <T extends ManagersName>(
  managerName: T,
  urls?: Partial<Environments>,
): ManagersMapping[T] => {
  if (managersManager === null) {
    managersManager = new SessionManager(urls);
  }

  return managersManager.getManager(managerName);
};
