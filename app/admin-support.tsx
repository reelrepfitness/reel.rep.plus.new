import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/contexts/auth";
import { colors } from "@/constants/colors";
import { useState } from "react";
import { MessageCircle, AlertCircle, Lightbulb, Bug, Send, CheckCircle } from "lucide-react-native";
import { isRTL } from '@/lib/utils';

type SupportTicket = {
  id: string;
  type: "feedback" | "bug" | "feature";
  title: string;
  description: string;
  userName: string;
  status: "pending" | "resolved";
  date: string;
};

export default function AdminSupportScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "resolved">("all");
  const [replyText, setReplyText] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  
  const [tickets] = useState<SupportTicket[]>([]);

  const getTypeIcon = (type: SupportTicket["type"]) => {
    switch (type) {
      case "feedback":
        return <MessageCircle size={20} color="#10B981" />;
      case "bug":
        return <Bug size={20} color="#EF4444" />;
      case "feature":
        return <Lightbulb size={20} color="#F59E0B" />;
    }
  };

  const getTypeLabel = (type: SupportTicket["type"]) => {
    switch (type) {
      case "feedback":
        return "משוב";
      case "bug":
        return "באג";
      case "feature":
        return "בקשת תכונה";
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return ticket.status === "pending";
    if (activeTab === "resolved") return ticket.status === "resolved";
    return true;
  });

  if (user?.role !== "admin") {
    return (
      <LinearGradient
        colors={["#3FCDD1", "#FFFFFF"]}
        locations={[0, 0.4]}
        style={styles.container}
      >
        <Stack.Screen
          options={{
            headerShown: true,
            title: "תמיכה ופניות",
            headerStyle: {
              backgroundColor: "#3FCDD1",
            },
            headerTintColor: "#FFFFFF",
            headerTitleAlign: "center",
          }}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>אין לך הרשאות גישה</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#3FCDD1", "#FFFFFF"]}
      locations={[0, 0.4]}
      style={styles.container}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "תמיכה ופניות",
          headerStyle: {
            backgroundColor: "#3FCDD1",
          },
          headerTintColor: "#FFFFFF",
          headerTitleAlign: "center",
        }}
      />

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "all" && styles.tabActive]}
          onPress={() => setActiveTab("all")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === "all" && styles.tabTextActive]}>
            הכל ({tickets.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "pending" && styles.tabActive]}
          onPress={() => setActiveTab("pending")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === "pending" && styles.tabTextActive]}>
            ממתין ({tickets.filter((t) => t.status === "pending").length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "resolved" && styles.tabActive]}
          onPress={() => setActiveTab("resolved")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === "resolved" && styles.tabTextActive]}>
            טופל ({tickets.filter((t) => t.status === "resolved").length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 150 }]}
        showsVerticalScrollIndicator={false}
      >
        {filteredTickets.map((ticket) => (
          <View key={ticket.id} style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
              <View style={styles.ticketType}>
                {getTypeIcon(ticket.type)}
                <Text style={styles.ticketTypeText}>{getTypeLabel(ticket.type)}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  ticket.status === "resolved"
                    ? styles.statusBadgeResolved
                    : styles.statusBadgePending,
                ]}
              >
                {ticket.status === "resolved" ? (
                  <CheckCircle size={14} color="#10B981" />
                ) : (
                  <AlertCircle size={14} color="#F59E0B" />
                )}
                <Text
                  style={[
                    styles.statusText,
                    ticket.status === "resolved"
                      ? styles.statusTextResolved
                      : styles.statusTextPending,
                  ]}
                >
                  {ticket.status === "resolved" ? "טופל" : "ממתין"}
                </Text>
              </View>
            </View>

            <Text style={styles.ticketTitle}>{ticket.title}</Text>
            <Text style={styles.ticketDescription}>{ticket.description}</Text>

            <View style={styles.ticketFooter}>
              <Text style={styles.ticketDate}>
                {new Date(ticket.date).toLocaleDateString("he-IL")}
              </Text>
              <Text style={styles.ticketUser}>{ticket.userName}</Text>
            </View>

            {selectedTicket === ticket.id && (
              <View style={styles.replySection}>
                <TextInput
                  style={styles.replyInput}
                  placeholder="כתוב תגובה..."
                  placeholderTextColor="#9CA3AF"
                  value={replyText}
                  onChangeText={setReplyText}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <TouchableOpacity style={styles.sendButton} activeOpacity={0.8}>
                  <Send size={18} color="#FFFFFF" />
                  <Text style={styles.sendButtonText}>שלח</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.replyButton}
              onPress={() => setSelectedTicket(selectedTicket === ticket.id ? null : ticket.id)}
              activeOpacity={0.8}
            >
              <MessageCircle size={18} color={colors.primary} />
              <Text style={styles.replyButtonText}>
                {selectedTicket === ticket.id ? "סגור" : "השב"}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {filteredTickets.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>אין פניות להצגה</Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
  },
  tabsContainer: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    padding: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.primary,
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  ticketCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  ticketHeader: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  ticketType: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    gap: 6,
  },
  ticketTypeText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#4B5563",
  },
  statusBadge: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgePending: {
    backgroundColor: "#FEF3C7",
  },
  statusBadgeResolved: {
    backgroundColor: "#D1FAE5",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  statusTextPending: {
    color: "#F59E0B",
  },
  statusTextResolved: {
    color: "#10B981",
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
    marginBottom: 8,
  },
  ticketDescription: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: isRTL ? "right" : "left",
    lineHeight: 22,
    marginBottom: 12,
  },
  ticketFooter: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginBottom: 12,
  },
  ticketUser: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.primary,
  },
  ticketDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  replySection: {
    marginTop: 12,
    gap: 8,
  },
  replyInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#2d3748",
    textAlign: isRTL ? "right" : "left",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minHeight: 80,
  },
  sendButton: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  replyButton: {
    flexDirection: (isRTL ? "row-reverse" : "row") as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  replyButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.primary,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
  },
});
