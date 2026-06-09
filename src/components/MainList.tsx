import { Item } from '../types';
import { ItemButton } from './ItemButton';
import styles from './MainList.module.css';

interface Props {
  items: Item[];
  onItemClick: (item: Item) => void;
}

export function MainList({ items, onItemClick }: Props) {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Items</h2>
      <ul className={styles.list}>
        {items.map(item => (
          <li key={item.id}>
            <ItemButton item={item} onClick={onItemClick} />
          </li>
        ))}
      </ul>
    </section>
  );
}
