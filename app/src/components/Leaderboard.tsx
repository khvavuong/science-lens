import { Image } from 'expo-image';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { leaderboardEntries, type LeaderboardEntry } from '@/lib/leaderboard';
import { colors, font, radius, space, type } from '@/theme';

const heroImage = require('../../assets/leaderboard/leaderboard-robot-wave.webp');
const podium = [leaderboardEntries[1], leaderboardEntries[0], leaderboardEntries[2]];
const standings = leaderboardEntries.slice(3);
const pointsFormat = new Intl.NumberFormat('vi-VN');

function entryLabel(entry: LeaderboardEntry) {
  return `Hạng ${entry.rank}. ${entry.name}. Mã ${entry.suffix}. ${pointsFormat.format(entry.points)} điểm.`;
}

function LeaderboardHeader() {
  return (
    <>
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={type.h1} accessibilityRole="header">Top 30 khám phá</Text>
          <Text style={type.caption}>Dữ liệu mẫu</Text>
        </View>
        <Image source={heroImage} style={styles.heroImage} contentFit="contain" accessible={false} />
      </View>

      <View style={styles.podium}>
        {podium.map((entry) => {
          const winner = entry.rank === 1;
          const runnerUp = entry.rank === 2;
          return (
            <View key={entry.rank} style={styles.place} accessible accessibilityLabel={entryLabel(entry)}>
              <View style={styles.podiumAvatarSlot}>
                <Image
                  source={entry.avatar}
                  style={[styles.podiumAvatar, winner && styles.winnerAvatar]}
                  contentFit="contain"
                  accessible={false}
                />
              </View>
              <Text style={styles.podiumName} maxFontSizeMultiplier={1.4}>{entry.name}</Text>
              <View style={styles.podiumScore}>
                <Text style={styles.code} maxFontSizeMultiplier={1.4}>{entry.suffix}</Text>
                <Text style={styles.points} maxFontSizeMultiplier={1.4}>{pointsFormat.format(entry.points)}</Text>
              </View>
              <View style={[styles.stand, winner ? styles.first : runnerUp ? styles.second : styles.third]}>
                <Text style={[styles.standRank, runnerUp && styles.secondRank]} maxFontSizeMultiplier={1.4}>{entry.rank}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.columnLabels} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Text style={styles.columnLabel}>Hạng</Text>
        <Text style={[styles.columnLabel, styles.nameLabel]}>Nhà khám phá</Text>
        <Text style={styles.columnLabel}>Điểm</Text>
      </View>
    </>
  );
}

function renderEntry({ item }: { item: LeaderboardEntry }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={entryLabel(item)}>
      <Text style={styles.rank} maxFontSizeMultiplier={1.4}>{item.rank}</Text>
      <Image source={item.avatar} style={styles.avatar} contentFit="contain" accessible={false} />
      <View style={styles.identity}>
        <Text style={styles.name} maxFontSizeMultiplier={1.4}>{item.name}</Text>
        <Text style={styles.code} maxFontSizeMultiplier={1.4}>{item.suffix}</Text>
      </View>
      <Text style={styles.points} maxFontSizeMultiplier={1.4}>{pointsFormat.format(item.points)}</Text>
    </View>
  );
}

export function Leaderboard({ bottomInset }: { bottomInset: number }) {
  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={[styles.listContent, { paddingBottom: bottomInset + space.lg }]}
      showsVerticalScrollIndicator={false}
      data={standings}
      keyExtractor={(entry) => entry.suffix}
      renderItem={renderEntry}
      ListHeaderComponent={LeaderboardHeader}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: { paddingHorizontal: space.md },
  hero: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, backgroundColor: colors.brandSoft, borderRadius: radius.lg },
  heroCopy: { flex: 1, gap: space.xs },
  heroImage: { width: 68, height: 64 },
  podium: { flexDirection: 'row', gap: space.xs, marginTop: space.sm, paddingHorizontal: space.xs, paddingTop: space.sm, backgroundColor: colors.bgAlt, borderRadius: radius.lg, overflow: 'hidden' },
  place: { flex: 1, minWidth: 0, alignItems: 'center' },
  podiumAvatarSlot: { height: 72, justifyContent: 'flex-end', alignItems: 'center' },
  podiumAvatar: { width: 60, height: 60, borderRadius: radius.pill, backgroundColor: colors.brandSoft, borderWidth: 2, borderColor: colors.white },
  winnerAvatar: { width: 72, height: 72, backgroundColor: colors.lumenSoft },
  podiumName: { flex: 1, textAlign: 'center', fontFamily: font.black, fontSize: 11, lineHeight: 15, color: colors.navy, marginTop: space.xs, paddingHorizontal: space.xs, alignSelf: 'stretch' },
  podiumScore: { alignItems: 'center', gap: space.xs, marginVertical: space.xs },
  stand: { width: '100%', padding: space.xs, justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: radius.sm, borderTopRightRadius: radius.sm },
  first: { minHeight: 44, backgroundColor: colors.lumen },
  second: { minHeight: 36, backgroundColor: colors.brandSoft },
  third: { minHeight: 28, backgroundColor: colors.surface },
  standRank: { fontFamily: font.black, color: colors.navy, fontSize: 16 },
  secondRank: { color: colors.brand },
  columnLabels: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.sm, paddingTop: space.md, paddingBottom: space.xs },
  columnLabel: { fontFamily: font.bold, fontSize: 11, color: colors.muted },
  nameLabel: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 60, padding: space.sm, borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth },
  rank: { width: 24, textAlign: 'center', color: colors.navy, fontFamily: font.black, fontSize: 13 },
  avatar: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.brandSoft },
  identity: { flex: 1, minWidth: 0, gap: space.xs },
  name: { fontFamily: font.bold, color: colors.navy, fontSize: 13, lineHeight: 18 },
  code: { fontFamily: font.medium, color: colors.muted, fontSize: 10, letterSpacing: 0.6 },
  points: { fontFamily: font.black, color: colors.brand, fontSize: 13, fontVariant: ['tabular-nums'] },
});
