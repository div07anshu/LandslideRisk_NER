import Card from "../../common/Card";
import { quickActions } from "../../data/quickActions";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

function QuickActions() {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {quickActions.map((qa) => {
        const Icon = qa.icon;

        return (
          <Link key={qa.titleKey} to={qa.path}>
            <Card className="p-5 flex items-center justify-between gap-4 hover:shadow-md transition-shadow cursor-pointer">
              <div>
                <div className="text-sm font-bold">{t(qa.titleKey)}</div>

                <div className="text-xs text-slate-500 mt-1">{t(qa.subtitleKey)}</div>
              </div>

              <div
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: qa.iconBg,
                }}
              >
                <Icon
                  size={18}
                  strokeWidth={3}
                  style={{
                    color: qa.iconColor,
                  }}
                />
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

export default QuickActions;