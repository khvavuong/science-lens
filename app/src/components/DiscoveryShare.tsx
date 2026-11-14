import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useEffect, useRef, useState } from "react";
import { Modal, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Image, Rect, Text as SvgText } from "react-native-svg";
import { Button, IconButton } from "./Button";
import { loadHistory, type JourneyRecord } from "@/lib/history";
import { colors, font, radius, space, type } from "@/theme";

export function cardLines(text: string, width: number, limit: number) {
  const lines: string[] = [];
  for (const word of text.trim().split(/\s+/)) {
    const last = lines.length - 1;
    if (last >= 0 && `${lines[last]} ${word}`.length <= width)
      lines[last] += ` ${word}`;
    else lines.push(word);
  }
  return lines
    .slice(0, limit)
    .map((line, i) =>
      i === limit - 1 && lines.length > limit
        ? `${line.slice(0, width - 1)}…`
        : line,
    );
}
export function DiscoveryShare({
  record,
  onClose,
}: {
  record: JourneyRecord;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const svg = useRef<Svg>(null);
  const [photo, setPhoto] = useState<string>();
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [videoUri, setVideoUri] = useState(record.videoUri);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        if (record.photoUri) {
          const file = new File(record.photoUri);
          if (file.exists) {
            const data = await file.base64();
            if (active)
              setPhoto(`data:${file.type || "image/jpeg"};base64,${data}`);
          }
        }
      } catch {
        /* Older discoveries can have an expired cache photo. */
      } finally {
        if (active) setReady(true);
      }
    })();
    void loadHistory().then((list) => {
      if (active)
        setVideoUri(list.find((r) => r.storyId === record.storyId)?.videoUri);
    });
    return () => {
      active = false;
    };
  }, [record]);
  const share = async (video = false) => {
    if (busy || !ready || (photo && !photoLoaded)) return;
    setBusy(true);
    setError("");
    try {
      if (!(await Sharing.isAvailableAsync()))
        throw new Error("Thiết bị chưa hỗ trợ chia sẻ.");
      let uri = videoUri;
      if (!video) {
        const data = await new Promise<string>((resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error("Chưa tạo được card. Thử lại nhé.")),
            15_000,
          );
          if (!svg.current) {
            clearTimeout(timer);
            reject(new Error("Card chưa sẵn sàng."));
            return;
          }
          // react-native-svg 15.16 trên iOS: truyền width/height chỉ phóng to khung ảnh, còn card vẫn vẽ
          // theo kích thước trên màn hình ở góc trên trái → ảnh gửi đi dư khoảng trắng lớn. iOS không truyền
          // kích thước: ảnh = card × scale màn hình (~1100–1200px). Android co nội dung đúng vào 1080×1440.
          const size =
            Platform.OS === "android" ? { width: 1080, height: 1440 } : undefined;
          svg.current.toDataURL((value) => {
            clearTimeout(timer);
            resolve(value);
          }, size);
        });
        const file = new File(Paths.cache, `card-${record.storyId}.png`);
        file.create({ overwrite: true });
        await file.write(data, { encoding: "base64" });
        uri = file.uri;
      }
      if (!uri || !new File(uri).exists)
        throw new Error(
          "File không còn trên thiết bị. Bạn vẫn có thể chia sẻ card ảnh.",
        );
      await Sharing.shareAsync(uri, {
        mimeType: video ? "video/mp4" : "image/png",
        UTI: video ? "public.mpeg-4" : "public.png",
        dialogTitle: "Khoe khám phá của bạn",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa chia sẻ được.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <View
        style={[
          styles.root,
          {
            paddingTop: insets.top + space.sm,
            paddingBottom: insets.bottom + space.sm,
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={type.h2}>Khoe khám phá</Text>
          <IconButton icon="close" label="Đóng chia sẻ" onPress={onClose} />
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Bo góc ở View cho phần xem trước; ảnh xuất ra phủ kín nền navy, không có góc trong suốt
              (app chat hiện góc trong suốt thành viền trắng/đen). */}
          <View
            style={styles.card}
            accessibilityLabel={`Card khám phá ${record.label}, đúng ${record.score}/${record.total} câu`}
          >
            <Svg
              ref={svg}
              width="100%"
              viewBox="0 0 540 720"
              style={{ aspectRatio: 3 / 4 }}
            >
              <Rect width="540" height="720" fill={colors.navy} />
              <Circle cx="520" cy="80" r="155" fill={colors.navySoft} />
              <Circle cx="10" cy="590" r="110" fill={colors.brand} />
              <SvgText
                x="32"
                y="47"
                fill={colors.lumen}
                fontFamily={font.bold}
                fontSize="18"
              >
                NHẬT KÝ TÒ MÒ
              </SvgText>
              <SvgText
                x="32"
                y="100"
                fill={colors.white}
                fontFamily={font.black}
                fontSize="34"
              >
                Tưởng quen. Lạ ghê!
              </SvgText>
              <Rect
                x="32"
                y="126"
                width="476"
                height="286"
                rx="24"
                fill={colors.surface}
              />
              {photo ? (
                <Image
                  onLoad={() => setPhotoLoaded(true)}
                  href={photo}
                  x="44"
                  y="138"
                  width="452"
                  height="262"
                  preserveAspectRatio="xMidYMid meet"
                />
              ) : (
                <SvgText
                  x="270"
                  y="285"
                  textAnchor="middle"
                  fill={colors.brand}
                  fontSize="68"
                >
                  ?
                </SvgText>
              )}
              {cardLines(record.label, 26, 2).map((line, i) => (
                <SvgText
                  key={`label${i}`}
                  x="32"
                  y={454 + i * 34}
                  fill={colors.lumen}
                  fontFamily={font.black}
                  fontSize="29"
                >
                  {line}
                </SvgText>
              ))}
              {cardLines(record.concept || record.title, 38, 3).map(
                (line, i) => (
                  <SvgText
                    key={`fact${i}`}
                    x="32"
                    y={530 + i * 28}
                    fill={colors.white}
                    fontFamily={font.semibold}
                    fontSize="22"
                  >
                    {line}
                  </SvgText>
                ),
              )}
              <Rect
                x="32"
                y="623"
                width="476"
                height="62"
                rx="20"
                fill={colors.lumen}
              />
              <SvgText
                x="52"
                y="661"
                fill={colors.navy}
                fontFamily={font.bold}
                fontSize="20"
              >
                {record.score}/{record.total} câu đúng. Bạn được mấy điểm?
              </SvgText>
            </Svg>
          </View>
          <Button
            label="Chia sẻ card ảnh"
            icon="share-outline"
            disabled={!ready || (!!photo && !photoLoaded)}
            loading={busy}
            onPress={() => {
              void share();
            }}
          />
          {videoUri && (
            <Button
              label="Chia sẻ video đã ghép"
              variant="secondary"
              icon="videocam-outline"
              loading={busy}
              onPress={() => {
                void share(true);
              }}
            />
          )}
          {!!error && (
            <Text accessibilityRole="alert" style={type.body}>
              {error}
            </Text>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.md,
  },
  content: { padding: space.md, gap: space.md },
  card: { borderRadius: radius.xl, overflow: "hidden" },
});
