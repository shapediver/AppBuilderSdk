import {roleUserOrAbove} from "@AppBuilderLib/shared/lib/platform";
import useAsync from "@AppBuilderShared/hooks/misc/useAsync";
import {IModelLibraryTabProps} from "@AppBuilderShared/pages/platform/LibraryPage";
import {useShapeDiverStorePlatform} from "@AppBuilderShared/store/useShapeDiverStorePlatform";
import {ModelCacheKeyEnum} from "@AppBuilderShared/types/store/shapediverStorePlatformModels";
import {useEffect, useState} from "react";

interface Props {
	/**
	 * Base URL for model view pages
	 */
	modelViewBaseUrl: string;
}

const filterDefault = {
	"deleted_at[?]": null,
	status: "done",
};

/**
 * Get configuration of tabs for the model library, depending on the user's role and organization.
 * @returns
 */
export default function useLibraryTabConfig(props: Props) {
	const {modelViewBaseUrl} = props;
	const getUser = useShapeDiverStorePlatform((state) => state.getUser);
	const [tabs, setTabs] = useState<IModelLibraryTabProps[]>([]);

	const {
		loading,
		error,
		value: user,
	} = useAsync(async () => {
		const user = await getUser();

		return user;
	}, []);

	useEffect(() => {
		if (!user) return;

		const tabs: IModelLibraryTabProps[] = [];

		if (user.organization) {
			/**
			 * "user" and above can see their own models, regardless of whether they are confirmed or not
			 */
			if (roleUserOrAbove(user.organization_role)) {
				tabs.push({
					name: "My models",
					tooltip: "Models owned by you",
					queryParams: {
						filters: {
							...filterDefault,
						},
					},
					filterByUser: true,
					cacheKey: ModelCacheKeyEnum.MyModels,
					modelViewBaseUrl,
					modelCardProps: {
						showUser: false,
						showBookmark: true,
					},
				});
			}

			/**
			 * "consumer" and "user" users with a team will only see their team's models.
			 * This restriction will not apply for "manager" users and above.
			 */
			tabs.push({
				name: "Organization models",
				tooltip: "All models owned by your organization",
				queryParams: {
					filters: {
						...filterDefault,
						"visibility[=]": "organization",
					},
				},
				filterByOrganization: true,
				cacheKey: ModelCacheKeyEnum.OrganizationConfirmedModels,
				modelViewBaseUrl,
				modelCardProps: {
					showBookmark: true,
				},
			});

			tabs.push({
				name: "Bookmarked",
				tooltip: "Models you bookmarked",
				queryParams: {
					filters: {
						...filterDefault,
						bookmarked: true,
					},
				},
				filterByOrganization: true,
				cacheKey: [
					ModelCacheKeyEnum.BookmarkedModels,
					ModelCacheKeyEnum.OrganizationConfirmedModels,
				],
				modelViewBaseUrl,
				modelCardProps: {
					showBookmark: true,
				},
			});
		} else {
			tabs.push({
				name: "All models",
				tooltip: "All models you have access to",
				queryParams: {
					filters: {
						...filterDefault,
					},
				},
				cacheKey: ModelCacheKeyEnum.AllModels,
				modelViewBaseUrl,
				modelCardProps: {
					showBookmark: true,
				},
			});
			tabs.push({
				name: "My models",
				tooltip: "Models owned by you",
				queryParams: {
					filters: {
						...filterDefault,
					},
				},
				filterByUser: true,
				cacheKey: ModelCacheKeyEnum.MyModels,
				modelViewBaseUrl,
				modelCardProps: {
					showUser: false,
					showBookmark: true,
				},
			});
			tabs.push({
				name: "Bookmarked",
				tooltip: "Models you bookmarked",
				queryParams: {
					filters: {
						...filterDefault,
						bookmarked: true,
					},
				},
				cacheKey: ModelCacheKeyEnum.BookmarkedModels,
				modelViewBaseUrl,
				modelCardProps: {
					showBookmark: true,
				},
			});
		}

		setTabs(tabs);
	}, [user]);

	return {
		tabs,
		loading,
		error,
	};
}
