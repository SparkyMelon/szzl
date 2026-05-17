import { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getDB } from '../lib/database';

interface TableData {
  name: string;
  rows: Record<string, unknown>[];
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function DebugScreen({ visible, onClose }: Props) {
  const [tables, setTables] = useState<TableData[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [version, setVersion] = useState<number>(0);

  useEffect(() => {
    if (!visible) return;
    loadData();
  }, [visible]);

  async function loadData() {
    const db = await getDB();

    const versionResult = await db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version'
    );
    setVersion(versionResult?.user_version ?? 0);

    const tableNames = await db.getAllAsync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`
    );

    const tableData = await Promise.all(
      tableNames.map(async ({ name }) => {
        const rows = await db.getAllAsync<Record<string, unknown>>(
          `SELECT * FROM ${name} LIMIT 50`
        );
        return { name, rows };
      })
    );

    setTables(tableData);
  }

  if (!__DEV__) return null;

  return (
    <>
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>

          {/* Header */}
          <View style={styles.header}>
            {selectedTable ? (
              <TouchableOpacity onPress={() => setSelectedTable(null)}>
                <Text style={styles.back}>← Back</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.title}>Debug</Text>
            )}
            <TouchableOpacity onPress={() => {
              onClose();
              setSelectedTable(null);
            }}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Table list */}
          {!selectedTable && (
            <ScrollView>
              <Text style={styles.meta}>Schema version: {version}</Text>
              <Text style={styles.sectionTitle}>Tables</Text>
              {tables.map(table => (
                <TouchableOpacity
                  key={table.name}
                  style={styles.tableRow}
                  onPress={() => setSelectedTable(table)}
                >
                  <Text style={styles.tableName}>{table.name}</Text>
                  <Text style={styles.tableCount}>{table.rows.length} rows →</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Table detail */}
          {selectedTable && (
            <ScrollView>
              <Text style={styles.sectionTitle}>{selectedTable.name}</Text>
              {selectedTable.rows.length === 0 && (
                <Text style={styles.empty}>No rows</Text>
              )}
              {selectedTable.rows.map((row, i) => (
                <View key={i} style={styles.rowCard}>
                  {Object.entries(row).map(([key, value]) => (
                    <Text key={key} style={styles.rowText}>
                      <Text style={styles.rowKey}>{key}: </Text>
                      {String(value ?? 'null')}
                    </Text>
                  ))}
                </View>
              ))}
            </ScrollView>
          )}

        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  back: {
    color: '#4af',
    fontSize: 16,
  },
  close: {
    color: '#888',
    fontSize: 20,
  },
  meta: {
    color: '#888',
    fontSize: 13,
    padding: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  tableName: {
    color: '#fff',
    fontSize: 15,
  },
  tableCount: {
    color: '#888',
    fontSize: 13,
  },
  empty: {
    color: '#888',
    padding: 16,
  },
  rowCard: {
    margin: 12,
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  rowText: {
    color: '#ccc',
    fontSize: 13,
    marginBottom: 2,
  },
  rowKey: {
    color: '#4af',
    fontWeight: 'bold',
  },
});