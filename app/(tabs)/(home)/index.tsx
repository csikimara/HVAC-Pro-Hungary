import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronDown, ChevronUp, Search, Star } from 'lucide-react-native';
import { TASK_GROUPS } from '@/constants/toolCatalog';

const HVAC_BG = '#0D0F12';
const HVAC_CARD = '#161A1F';
const HVAC_BORDER = '#2A2F38';
const HVAC_TEXT = '#E8ECF0';
const HVAC_TEXT_SECONDARY = '#98A3AF';
const HVAC_BLUE = '#1E90FF';

export default function HomeScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [openGroups, setOpenGroups] = useState<string[]>([TASK_GROUPS[0].title]);

  const groups = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('hu');
    if (!needle) return TASK_GROUPS;
    return TASK_GROUPS.map((group) => ({
      ...group,
      tasks: group.tasks.filter((task) => `${task.title} ${task.description}`.toLocaleLowerCase('hu').includes(needle)),
    })).filter((group) => group.tasks.length > 0);
  }, [query]);

  const toggleGroup = (title: string) => {
    setOpenGroups((current) => current.includes(title)
      ? current.filter((item) => item !== title)
      : [...current, title]);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: HVAC_BG }}
      contentContainerStyle={{ paddingBottom: 110, paddingHorizontal: 16 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: 58, paddingBottom: 22 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: HVAC_TEXT }}>HVAC Pro</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: HVAC_BLUE }}>Hungary</Text>
        </View>
        <Text style={{ fontSize: 24, fontWeight: '800', color: HVAC_TEXT, marginTop: 22 }}>Mit szeretnél megoldani?</Text>
        <Text style={{ fontSize: 15, color: HVAC_TEXT_SECONDARY, lineHeight: 21, marginTop: 6 }}>
          Válaszd ki a helyszíni feladatot. Az app megmondja, mit kell megadnod és milyen pontosságú az eredmény.
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C2128', borderColor: HVAC_BORDER, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, marginBottom: 16 }}>
        <Search size={20} color={HVAC_TEXT_SECONDARY} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Például: nyomásveszteség, PT, háromfázis…"
          placeholderTextColor="#687382"
          style={{ flex: 1, color: HVAC_TEXT, fontSize: 15, paddingVertical: 14, marginLeft: 10 }}
        />
      </View>

      {groups.map((group) => {
        const open = query.trim().length > 0 || openGroups.includes(group.title);
        return (
          <View key={group.title} style={{ marginBottom: 12 }}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => toggleGroup(group.title)}
              style={{ backgroundColor: HVAC_CARD, borderColor: HVAC_BORDER, borderWidth: 1, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' }}
            >
              <View style={{ width: 7, alignSelf: 'stretch', borderRadius: 4, backgroundColor: group.color, marginRight: 13 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: HVAC_TEXT, fontSize: 17, fontWeight: '800' }}>{group.title}</Text>
                <Text style={{ color: HVAC_TEXT_SECONDARY, fontSize: 13, lineHeight: 18, marginTop: 4 }}>{group.subtitle}</Text>
              </View>
              {open ? <ChevronUp size={20} color={group.color} /> : <ChevronDown size={20} color={group.color} />}
            </TouchableOpacity>

            {open && (
              <View style={{ paddingTop: 8, gap: 8 }}>
                {group.tasks.map((task) => (
                  <TouchableOpacity
                    key={task.title}
                    onPress={() => router.push(task.route as never)}
                    activeOpacity={0.72}
                    style={{ backgroundColor: '#11151A', borderColor: '#252B33', borderWidth: 1, borderRadius: 14, padding: 15, marginLeft: 10 }}
                  >
                    <Text style={{ color: task.color, fontSize: 16, fontWeight: '800' }}>{task.title}</Text>
                    <Text style={{ color: '#A7B0BC', fontSize: 14, lineHeight: 20, marginTop: 5 }}>{task.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        );
      })}

      {groups.length === 0 && (
        <Text style={{ color: HVAC_TEXT_SECONDARY, fontSize: 15, textAlign: 'center', marginVertical: 24 }}>
          Erre még nincs találat. Próbáld rövidebb kifejezéssel.
        </Text>
      )}

      <TouchableOpacity onPress={() => router.push('/(tabs)/(kedvencek)' as never)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16 }}>
        <Star size={19} color="#C084FC" />
        <Text style={{ color: '#C084FC', fontSize: 15, fontWeight: '700' }}>Mentett számítások</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
