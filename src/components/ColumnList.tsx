import { ColumnItem, Item, ItemType } from '../types';
import { ItemButton } from './ItemButton';
import styles from './ColumnList.module.css';

interface Props {
  type: ItemType;
  items: ColumnItem[];
  onItemClick: (item: Item) => void;
}

const EMOJI: Record<ItemType, string> = {
  Fruit: '🍎',
  Vegetable: '🥦',
};

export function ColumnList({ type, items, onItemClick }: Props) {
  return (
    <section className={`${styles.section} ${styles[type.toLowerCase() as 'fruit' | 'vegetable']}`}>
      <h2 className={styles.title}>
        {EMOJI[type]} {type}
      </h2>
      <ul className={styles.list}>
        {items.map(({ item, addedAt }) => (
          <li key={item.id}>
            <ItemButton item={item} onClick={onItemClick} addedAt={addedAt} />
          </li>
        ))}
        {items.length === 0 && (
          <li className={styles.empty}>—</li>
        )}
      </ul>
    </section>
  );
}
